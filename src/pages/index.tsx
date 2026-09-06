import { useEffect, useState } from "react";
import ModalInputAddress from "./components/ModalInputAddress";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, Layout, Space, Table } from "antd";
import { Config, useConnectorClient } from "wagmi";
import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
const { Header, Footer, Sider, Content } = Layout;

type TableData = {
  address: string;
  balance: string;
  status: string;
};

export default function HomePage() {
  const [list, setList] = useState<TableData[]>([]);
  const { data: client } = useConnectorClient<Config>();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  useEffect(() => {
    if (client == null) {
      setProvider(null);
      setSigner(null);
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
      setSigner(null);
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
          />
        </Content>
        <Footer style={{ textAlign: "right" }}>
          <Space>
            <Button type="primary" onClick={() => console.log("发起转账")}>
              发起转账
            </Button>
            <Button type="primary" onClick={() => console.log("刷新余额")}>
              刷新余额出
            </Button>
            <ModalInputAddress
              onOK={(addresses) => {
                const newList = addresses.map((address) => ({
                  address,
                  balance: "-",
                  status: "-",
                }));
                setList([...newList]);
              }}
            />
            <Button
              onClick={() =>
                provider
                  ?.getBalance("0xf563C92E33d094c3BcC3AF3d499e27CaF987DD77")
                  .then((balance) => console.log(balance))
              }
            >
              测试
            </Button>
          </Space>
        </Footer>
      </Layout>
    </div>
  );
}
