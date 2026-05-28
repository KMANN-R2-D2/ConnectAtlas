export class AHSService {
  // AHS data is now fully static/hard-coded to avoid unnecessary API calls.
  // It lives inside UCalgaryService.getWellnessResourcesStatic().ahs as well,
  // but is kept here for controllers that import AHSService directly.

  getResources() {
    return {
      healthLink: {
        name: "Health Link 811",
        phone: "811",
        description: "24/7 health advice from registered nurses",
        website:
          "https://www.albertahealthservices.ca/assets/healthinfo/link/index.html",
        whenToCall: [
          "You need health advice but aren't sure if it's an emergency",
          "You're deciding whether to go to the ER",
          "You need information about health services in Alberta",
        ],
      },
      mentalHealthHelpLine: {
        name: "Alberta Mental Health Help Line",
        phone: "1-877-303-2642",
        description:
          "Free, confidential 24/7 mental health support and crisis intervention for Albertans",
        available: "24/7",
      },
      addictionHelpLine: {
        name: "AHS Addiction Help Line",
        phone: "1-866-332-2322",
        description:
          "24/7 support and referrals for substance use concerns. Translation services available.",
        available: "24/7",
      },
      distressCentre: {
        name: "Distress Centre Calgary",
        phone: "403-266-4357",
        text: "587-333-2724",
        description: "24/7 crisis support and suicide prevention",
        website: "https://www.distresscentre.com",
        available: "24/7",
      },
      suicideCrisisHelpline: {
        name: "Suicide Crisis Helpline",
        phone: "988",
        text: "988",
        description: "National 24/7 suicide prevention line — call or text",
        available: "24/7",
      },
      urgentCare: [
        {
          name: "Sheldon M. Chumir Health Centre",
          address: "1213 4 St SW, Calgary, AB",
          phone: "403-955-6200",
          hours: "24/7",
          services: ["Urgent care", "Mental health crisis assessment"],
          note: "Crisis mental health assessment available here",
        },
        {
          name: "South Health Campus Urgent Care",
          address: "4448 Front St SE, Calgary, AB",
          phone: "403-956-1300",
          hours: "24/7",
        },
      ],
      emergencyRooms: [
        {
          name: "Foothills Medical Centre",
          address: "1403 29 St NW, Calgary, AB",
          phone: "403-944-1110",
          note: "Closest ER to UofC Main Campus",
        },
        {
          name: "Peter Lougheed Centre",
          address: "3500 26 Ave NE, Calgary, AB",
          phone: "403-943-4555",
        },
      ],
      calgaryFamilyServices: {
        name: "Calgary Sexual Health Centre",
        address: "301 14 St NW, Calgary",
        phone: "403-283-5580",
        services: ["STI testing", "Birth control", "Pregnancy testing"],
        website: "https://www.calgarysexualhealth.ca",
      },
    };
  }

  // Kept for backward-compat — now returns static data instead of scraping
  async searchClinics(_location: string = "Calgary") {
    return [
      {
        name: "Sheldon M. Chumir Health Centre",
        type: "Urgent Care & Walk-in",
        address: "1213 4 St SW, Calgary",
        phone: "403-955-6200",
        hours: "24/7",
      },
      {
        name: "Calgary Sexual Health Centre",
        type: "Sexual Health Clinic",
        address: "301 14 St NW, Calgary",
        phone: "403-283-5580",
        services: ["STI testing", "Birth control", "Pregnancy testing"],
      },
    ];
  }
}