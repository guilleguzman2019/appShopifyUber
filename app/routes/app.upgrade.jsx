import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {

  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  console.log(myShop);

  const selectedPlan = new URL(request.url).searchParams.get("plan");
  const selectedPlanFinal = selectedPlan === "ANNUAL_PLAN" ? ANNUAL_PLAN : MONTHLY_PLAN;


  await billing.require({
    plans: [selectedPlanFinal],
    onFailure: async () => billing.request({
      plan: selectedPlanFinal,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${myShop}/apps/${process.env.APP_NAME}/app/pricing`,
    }),
  });

  return null;
};