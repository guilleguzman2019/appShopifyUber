// Segunda parte
import { json } from "@remix-run/node";
import {
  Button
} from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

import prisma from '../db.server';

export async function loader({ request }) {

  const { billing, session } = await authenticate.admin(request);

  let { shop } = session;

  try {

    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
      isTest: true,
      onFailure: () => {
        throw new Error("No active plan");
      },
    });

    console.log(billingCheck);

    const subscription = billingCheck.appSubscriptions[0];

    console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);

    const actualizado = await prisma.tienda.update({
      where: {
        nombre: shop, // Aquí se está usando el nombre de la tienda como identificador
      },
      data: {
        plan: subscription.name, // El nuevo valor para el campo 'plan'
      },
    });

    console.log(actualizado);

    return json({ billing, plan: subscription });
  } catch (error) {
    
    if (error.message === "No active plan") {
      console.log("Shop does not have any active plans.");

      const actualizado = await prisma.tienda.update({
        where: {
          nombre: shop, // Aquí se está usando el nombre de la tienda como identificador
        },
        data: {
          plan: 'free', // El nuevo valor para el campo 'plan'
        },
      });

      return json({ billing, plan: { name: "free" } });
    }
    throw error;
  }
}

const planData = [
  {
    title: "free",
    description: "Free plan with basic features",
    price: "0",
    action: "Upgrade to free",
    name: "free",
    url: "/app/upgrade?plan=MONTHLY_PLAN",
    features: ["5 shipping per month"],
  },
  {
    title: "Pro Monthly",
    description: "Pro plan with advanced features",
    price: "25",
    name: "Monthly subscription",
    action: "Upgrade to Pro Monthly",
    url: "/app/upgrade?plan=MONTHLY_PLAN",
    actionCancel: "cancel to Pro Monthly",
    urlCancel: "/app/cancel?plan=MONTHLY_PLAN",
    features: [
      "Unlimited shipping per day",
      "Priority support",
    ],
  },
  {
    title: "Pro Annual",
    description: "Annual Pro plan with discount",
    price: "250",
    name: "Annual subscription",
    action: "Upgrade to Pro Annual",
    url: "/app/upgrade?plan=ANNUAL_PLAN",
    actionCancel: "cancel to Pro Annual",
    urlCancel: "/app/cancel?plan=ANNUAL_PLAN",
    features: [
      "Unlimited shipping per day",
      "Priority support",
    ],
  },
];

export default function PricingPage() {

  const { plan } = useLoaderData();

  console.log(plan);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-10" style={{ fontFamily: "Montserrat, serif" }}>
      <div className="p-6 w-full max-w-3xl text-center">
        <h2 className="text-2xl font-bold">Change Your Plan</h2>
        <p className="mt-2 text-gray-600">
          {plan.name === "Monthly subscription"
            ? "You're currently on the Pro plan. All features are unlocked."
            : "You're currently on the Free plan. Upgrade to unlock more features."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-5xl">
        {planData.map((planItem, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-xl font-semibold">{planItem.title}</h3>
            <p className="text-gray-600 mt-2">{planItem.description}</p>
            <p className="text-3xl font-bold mt-4">${planItem.price}</p>
            <ul className="text-sm text-gray-700 mt-4 space-y-2 mb-4">
              {planItem.features.map((feature, idx) => (
                <li key={idx} className="flex items-center">✅ {feature}</li>
              ))}
            </ul>
            {planItem.name !== plan.name ? (
              <Button tone="success" primary url={planItem.url}>
                {planItem.action}
              </Button>
            ) : (
              <div className="">
                <p className="mt-4 text-gray-500 mb-3">You're currently on this plan</p>
                {planItem.name != 'free' ? (
                  <Button tone="critical" primary url={planItem.urlCancel}>
                    {planItem.actionCancel}
                  </Button>):('')}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
