import React, { useState } from "react";
import { Button, Input, Modal, message } from "antd";

type AppData = {
  onOK: (addresses: string[]) => void;
};

const App: React.FC<AppData> = ({ onOK }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    if (inputValue.trim() === "") {
      message.error("地址不能为空");
      return;
    }

    let addresses = inputValue.split("\n").map((addr) => addr.trim());
    addresses = addresses.filter((addr) => addr !== "");

    if (addresses.length === 0) {
      message.error("请输入有效的地址");
      return;
    }

    for (const addr of addresses) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        message.error(`地址 ${addr} 格式不正确`);
        return;
      }
    }

    const seen = new Set<string>();
    const uniqueAddresses = addresses.filter((address) => {
      const normalizedAddress = address.toLowerCase();
      if (seen.has(normalizedAddress)) {
        return false;
      }
      seen.add(normalizedAddress);
      return true;
    });

    onOK && onOK(uniqueAddresses);

    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        录入地址
      </Button>
      {/* <Button type="primary" onClick={showModal}>
        Open Modal
      </Button> */}
      <Modal
        title="录入地址"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
      >
        <Input.TextArea
          rows={10}
          placeholder="请输入地址, 每行一个"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default App;
