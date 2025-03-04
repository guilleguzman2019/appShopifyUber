import { redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export const loader = async ({ request }) => {

  const { billing, session } = await authenticate.admin(request);
  let { shop } = session;
  let myShop = shop.replace(".myshopify.com", "");

  // Obtén el plan seleccionado desde la URL
  const selectedPlan = new URL(request.url).searchParams.get("plan");
  const selectedPlanFinal = selectedPlan === "ANNUAL_PLAN" ? ANNUAL_PLAN : MONTHLY_PLAN;

  // Verifica y maneja la suscripción
  const billingCheck = await billing.require({
    plans: [selectedPlanFinal],
    onFailure: async () => billing.request({
      plan: selectedPlanFinal,
      isTest: true,
    }),
  });

  const subscription = billingCheck.appSubscriptions[0];

  // Cancela la suscripción, si existe
  const cancelledSubscription = await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });

  // Redirige a la página de precios
  return redirect("/app/pricing");
};
