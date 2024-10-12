"use client";
import Header from "@/components/Header";
import { SessionProvider } from "next-auth/react";

import { AppProps } from "next/app";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

export default function Home() {
  return (
    <BrowserRouter>
    <SessionProvider>
      <Header></Header>
    </SessionProvider>
    </BrowserRouter>
    
  );
}
