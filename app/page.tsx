"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Button, Layout, Badge, Typography, Space, Card, Popover } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { io, Socket } from "socket.io-client";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

interface Message {
  name: string;
  text: string;
}

export default function Home() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(0);
  const [userList, setUserList] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.on("message", (msg: Message) => setMessages((prev) => [...prev, msg]));
    socket.on("online", (count: number) => setOnline(count));
    socket.on("userList", (users: string[]) => setUserList(users));
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const join = () => {
    if (!name.trim()) return;
    socketRef.current?.emit("join", name.trim());
    setJoined(true);
  };

  const send = () => {
    if (!input.trim()) return;
    socketRef.current?.emit("message", input.trim());
    setInput("");
  };

  if (!joined) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
        <Card title="💬 Tham gia Chat Room" style={{ width: 360 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tên của bạn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={join}
              size="large"
            />
            <Button type="primary" size="large" onClick={join}>Vào</Button>
          </Space.Compact>
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "#fff", fontSize: 18 }} strong>💬 Chat Room</Text>
        <Popover
          trigger="click"
          title="Đang online"
          content={
            userList.length ? (
              <div>{userList.map((u, i) => <div key={i} style={{ padding: "4px 0" }}><UserOutlined style={{ marginRight: 6 }} />{u}</div>)}</div>
            ) : <Text type="secondary">Chưa có ai</Text>
          }
          onOpenChange={(open) => { if (open) socketRef.current?.emit("getUserList"); }}
        >
          <Badge count={online} overflowCount={999} style={{ backgroundColor: "#52c41a" }} showZero>
            <Button type="link" style={{ color: "#fff", padding: 0 }}>Online</Button>
          </Badge>
        </Popover>
      </Header>
      <Content ref={listRef} style={{ flex: 1, overflow: "auto", padding: 16, background: "#f0f2f5" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {messages.map((msg, i) => {
            if (msg.name === "System") {
              return <div key={i} style={{ textAlign: "center", padding: 4 }}><Text type="secondary" italic>{msg.text}</Text></div>;
            }
            const isMe = msg.name === name;
            return (
              <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", padding: 4 }}>
                <div style={{ background: isMe ? "#1677ff" : "#fff", color: isMe ? "#fff" : "#000", padding: "8px 14px", borderRadius: 12, maxWidth: "70%" }}>
                  {!isMe && <Text style={{ fontSize: 11, color: "#888" }}>{msg.name}</Text>}
                  <div>{msg.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Content>
      <Footer style={{ padding: 12, background: "#fff" }}>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={send}
            size="large"
          />
          <Button type="primary" icon={<SendOutlined />} size="large" onClick={send} />
        </Space.Compact>
      </Footer>
    </Layout>
  );
}
