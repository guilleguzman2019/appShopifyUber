import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";


import {getUberToken} from '../functions/getDeliveryQuote'

import {getUberQuote} from '../functions/getDeliveryQuote'

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];



export const loader = async ({ request }) => {

  const { admin } = await authenticate.admin(request);

  /*

  const response = await admin.graphql(
    `#graphql
    query CarrierServiceList {
      carrierServices(first: 10, query: "active:true") {
        edges {
          node {
            id
            name
            callbackUrl
            active
            supportsServiceDiscovery
          }
        }
      }
    }`,
  );

  const response2 = await admin.graphql(
    `#graphql
    mutation CarrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {
      carrierServiceCreate(input: $input) {
        carrierService {
          id
          name
          callbackUrl
          active
          supportsServiceDiscovery
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        "input": {
          "name": "test carrier service",
          "callbackUrl": "https://annotated-polyphonic-customs-enforcement.trycloudflare.com/carrier-service-callback",
          "supportsServiceDiscovery": true,
          "active": true
        }
      },
    },
  );

  
  const data2= await response2.json();

  const data = await response.json();

  */

  return {apiKey: process.env.SHOPIFY_API_KEY || ""};

};

export default function App() {

  const { apiKey } = useLoaderData();

  console.log(apiKey);

  return (

    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Ajustes Uber Direct</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
