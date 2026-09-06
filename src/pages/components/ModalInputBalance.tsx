import React, { useState } from "react";
import { Button, Divider, Input, Modal, Space, message } from "antd";
import { Signer, ethers } from "ethers";

type AppData = {
  signer: Signer | undefined;
  onOk: (amount: bigint) => void;
};

const App: React.FC<AppData> = ({ signer, onOk }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balance, setBalance] = useState<string>("-");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [transferAmount, setTransferAmount] = useState<string>("");

  const loadBalance = async () => {
    if (signer == null || signer.provider == null) {
      setBalance("-");
      return;
    }

    setIsLoadingBalance(true);

    try {
      const address = await signer.getAddress();
      const rawBalance = await signer.provider.getBalance(address);
      setBalance(ethers.formatEther(rawBalance));
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
      setBalance("-");
      message.error("获取钱包余额失败");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const showModal = async () => {
    if (signer == null || signer.provider == null) {
      message.warning("请先连接钱包");
      return;
    }

    setIsModalOpen(true);
    await loadBalance();
  };

  const handleOk = () => {
    if (transferAmount.trim() === "") {
      message.error("转账金额不能为空");
      return;
    }

    const amount = ethers.parseEther(transferAmount);
    if (amount <= 0) {
      message.error("转账金额输入错误");
      return;
    }

    onOk && onOk(amount);

    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        发起转账
      </Button>
      <Modal
        title="输入转账金额"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
      >
        <Divider />
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>转账金额：</div>
          <Input
            placeholder="请输入转账金额"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
        </Space>
        <Space
          style={{
            padding: "20px 0",
            color: "green",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          <div>
            当前钱包余额：{isLoadingBalance ? "加载中..." : `${balance} ETH`}
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default App;
