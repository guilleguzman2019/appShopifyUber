import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import prisma from '../db.server';

import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  
  const { admin, session } = await authenticate.admin(request);

  let myShop = session.shop.replace(".myshopify.com", "");

  let nameApp = process.env.APP_NAME ;
  
  return {shop: myShop, nombreApp: nameApp} ;
};

export const action = async ({ request }) => {

  const { admin } = await authenticate.admin(request);
  
  return null;
};

export default function Index() {

  const { shop, nombreApp } = useLoaderData();
  

  return (
    <div className="max-w-4xl mx-auto my-9" style={{ fontFamily: "Montserrat, serif" }}>
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-4 bg-white rounded p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-4">Welcome to Uber Direct for Shopify</h1>
          <p className="text-gray-700 mb-4">
            Uber Direct is a seamless delivery solution that integrates directly with Shopify, enabling merchants to offer fast and reliable deliveries to their customers.
          </p>

          <h2 className="text-xl font-semibold mb-2">How It Works</h2>
          <p className="text-gray-700 mb-4">
            With Uber Direct, you can automate local deliveries by leveraging Uber’s vast network of drivers. Once an order is placed, a driver is assigned, and the customer receives real-time tracking updates.
          </p>

          <h2 className="text-xl font-semibold mb-2">Steps to Get Started</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>Install the Uber Direct app from the Shopify App Store.</li>
            <li>Connect your Shopify store with your Uber Direct account.</li>
            <img src="https://d1a3f4spazzrp4.cloudfront.net/uberex/duc/developerDashboard-screen.png" alt=""  width={300}/>
            <li>Configure delivery options and pricing.</li>
            <img src="https://i.postimg.cc/vTcnyzfy/image.png" alt=""  width={300} />
            <li>Enable Uber Direct at checkout for your customers.</li>
            <li>Start fulfilling orders with Uber’s reliable delivery network.</li>
            <li>Start fulfilling orders with Uber’s reliable delivery network.</li>
          </ol>

          <h2 className="text-xl font-semibold mt-4 mb-2">Benefits</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Fast and reliable same-day delivery.</li>
            <li>Real-time tracking for both merchants and customers.</li>
            <li>Seamless integration with your Shopify store.</li>
            <li>Flexible pricing based on delivery distance.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-4 mb-2">Subscription Options</h2>
          <p className="text-gray-700 mb-4">
            In the <strong>Pricing</strong> section, enable a subscription plan in addition to the free option to access unlimited deliveries, support, and maintenance. <a href={`https://admin.shopify.com/store/${shop}/apps/${nombreApp}/app/pricing`} className="text-blue-600 underline">To pricing</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
