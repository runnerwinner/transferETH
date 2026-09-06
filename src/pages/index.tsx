import { useEffect, useRef, useState } from "react";
import ModalInputAddress from "./components/ModalInputAddress";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, Layout, Space, Table, message } from "antd";
import { Config, useConnectorClient } from "wagmi";
import { Signer } from "ethers";
import { BrowserProvider, ethers } from "ethers";
import ModalInputBalance from "./components/ModalInputBalance";
const { Header, Footer, Content } = Layout;

type TableData = {
  address: string;
  balance: string;
  status: string;
};

export default function HomePage() {
  const [list, setList] = useState<TableData[]>([]);
  const listRef = useRef<TableData[]>([]);
  const { data: client } = useConnectorClient<Config>();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | undefined>(undefined);

  const [updateListCount, setUpdateListCount] = useState<number>(1);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  const updateAddressStatus = (address: string, status: string) => {
    const target = address.toLowerCase();
    setList((prevList) =>
      prevList.map((item) =>
        item.address.toLowerCase() === target ? { ...item, status } : item,
      ),
    );
  };

  const handleRefreshBalances = async (targetList?: TableData[]) => {
    const currentList = targetList ?? listRef.current;
    if (!provider || currentList.length === 0) {
      return;
    }

    const balanceEntries = await Promise.all(
      currentList.map(async (item) => {
        try {
          const balance = await provider.getBalance(item.address);
          return [
            item.address.toLowerCase(),
            ethers.formatEther(balance),
          ] as const;
        } catch (error) {
          console.error(`Failed to fetch balance for ${item.address}:`, error);
          return [item.address.toLowerCase(), "Error"] as const;
        }
      }),
    );

    const balanceMap = new Map(balanceEntries);
    setList((prevList) =>
      prevList.map((item) => ({
        ...item,
        balance: balanceMap.get(item.address.toLowerCase()) ?? item.balance,
      })),
    );
  };

  const watchTransactionStatus = async (
    tx: ethers.TransactionResponse,
    toAddress: string,
  ) => {
    try {
      updateAddressStatus(toAddress, "交易正在处理");
      const receipt = await tx.wait(1, 180000);

      if (receipt == null) {
        updateAddressStatus(toAddress, "交易超时");
        return;
      }

      updateAddressStatus(
        toAddress,
        receipt.status === 1 ? "交易成功" : "交易失败",
      );
      await handleRefreshBalances();
    } catch (error) {
      updateAddressStatus(toAddress, "交易失败");
      console.error(`Failed to track transaction ${tx.hash}:`, error);
      message.error(`监听交易 ${tx.hash} 状态失败`);
    }
  };

  // 余额刷新
  useEffect(() => {
    void handleRefreshBalances();
  }, [updateListCount, provider]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  useEffect(() => {
    if (client == null) {
      setProvider(null);
      setSigner(undefined);
      return;
    }

    const browserProvider = new ethers.BrowserProvider(client.transport);
    setProvider(browserProvider);

    browserProvider.getSigner(0).then((res) => {
      setSigner(res);
    });

    return () => {
      browserProvider.destroy();
      setProvider(null);
      setSigner(undefined);
    };
  }, [client]);

  return (
    <div>
      <Layout
        style={
          window.innerWidth > 1000
            ? { padding: "100px 200px", background: "#fff" }
            : { padding: "100px 20px", background: "#fff" }
        }
      >
        <Header>
          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
            align="center"
          >
            <div
              style={{ color: "#fff", fontSize: "20px", fontWeight: "bold" }}
            >
              ETH 批量转账
            </div>
            <ConnectButton />
          </Space>
        </Header>
        <Content>
          <Table
            dataSource={list}
            rowKey="address"
            columns={[
              { title: "地址", dataIndex: "address", key: "address" },
              { title: "可用余额", dataIndex: "balance", key: "balance" },
              { title: "状态", dataIndex: "status", key: "status" },
            ]}
            pagination={false}
          />
        </Content>
        <Footer style={{ textAlign: "right" }}>
          <Space>
            <ModalInputBalance
              signer={signer}
              onOk={async (amount) => {
                console.log("转账金额:", amount);
                if (!signer) {
                  message.warning("请先连接钱包");
                  return;
                }

                if (list.length === 0) {
                  message.warning("请先录入地址");
                  return;
                }

                for (const item of list) {
                  try {
                    const tx = await signer.sendTransaction({
                      to: item.address,
                      value: amount,
                    });
                    updateAddressStatus(item.address, "已发送，待打包");
                    void watchTransactionStatus(tx, item.address);
                  } catch (err: unknown) {
                    updateAddressStatus(item.address, "发送失败");
                    console.error(
                      `转账失败，地址: ${item.address}, 错误信息:`,
                      err,
                    );
                    message.error(
                      `转账失败，地址: ${item.address}, 错误信息: ${getErrorMessage(err)}`,
                    );
                  }
                }
              }}
            />
            <Button
              type="primary"
              onClick={async (): Promise<void> => {
                if (list.length > 0) {
                  await handleRefreshBalances();
                  message.success("余额刷新成功");
                }
              }}
            >
              刷新余额
            </Button>
            <ModalInputAddress
              onOK={(addresses) => {
                const newList = addresses.map((address) => ({
                  address,
                  balance: "-",
                  status: "-",
                }));
                setList([...newList]);
                listRef.current = newList;
                void handleRefreshBalances(newList);
                setUpdateListCount((prev) => prev + 1);
              }}
            />
            <Button
              onClick={() => {
                provider
                  ?.getBalance("0xbFdF0180264c4B23643658ff491b72985c4c310B")
                  ?.then((balance) => console.log(balance));
                signer
                  ?.sendTransaction({
                    to: "0xbFdF0180264c4B23643658ff491b72985c4c310B",
                    value: ethers.parseEther("0.001"),
                  })
                  .then((tx) => console.log(tx))
                  .catch((err) => console.error(err));
              }}
            >
              测试
            </Button>
          </Space>
        </Footer>
      </Layout>
    </div>
  );
}
