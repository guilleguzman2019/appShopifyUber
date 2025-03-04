import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import prisma from '../db.server';

import { useLoaderData } from "@remix-run/react";

//import { json } from "@remix-run/node";

import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `
      query getProductInfo {
        products(first: 1) {
          nodes {
            title
            id
          }
        }
      }
    `
  );

  // Extraer los datos de la respuesta JSON
  const data = await response.json();

  const products = data.data.products.nodes.map(product => ({
    title: product.title,
    id: product.id
  }));

  // Buscar configuraciones en la base de datos
  let settings = await prisma.ajustes.findFirst({
    where: {
      tiendaId: 7,
    },
  });

  if (!settings) {
    settings = {};
  }

  return { settings, products };
}

export default function AdditionalPage() {
  const { products, settings } = useLoaderData();
  console.log(settings);

  return (
    <Page>
      <TitleBar title="Additional page" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which
                demonstrates how to create multiple pages within app navigation
                using{" "}
                <Link
                  url="https://shopify.dev/docs/apps/tools/app-bridge"
                  target="_blank"
                  removeUnderline
                >
                  App Bridge
                </Link>
                .
              </Text>
              <Text as="p" variant="bodyMd">
                To create your own page and have it show up in the app
                navigation, add a page inside.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Products
              </Text>
              <List>
                {products.map((product) => (
                  <List.Item key={product.id}>{product.title}</List.Item>
                ))}
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}