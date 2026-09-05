// Copy source for app/authenticated surfaces.
// AA-29 moved app strings here for the lint gate. No restyle/logic changes in Wave B
// — Wave C owns restyling these surfaces.

export const APP = {
  dashboard: {
    title: "Your dashboard",
    subtitle: "Manage your AppealDeck services and seller-account tools here.",
    noPass: {
      heading: "No active Appeal Pass",
      desc: "Buy the $199 one-time Appeal Pass to unlock your drafted Plan of Action and tools.",
      cta: "Get the Appeal Pass",
    },
    active: {
      heading: "Appeal Pass active",
      planLabel: "Plan",
      grantedLabel: "Granted",
      licenseLabel: "License",
    },
  },
  breadcrumb: {
    home: "Home",
  },
} as const;
