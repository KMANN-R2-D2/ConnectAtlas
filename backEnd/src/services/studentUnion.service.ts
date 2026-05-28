export class StudentUnionService {

  // ─── HEALTH & WELLNESS (SU portion) ──────────────────────────────────────

  getWellnessResources() {
    return {
      insurance: {
        name: "StudentCare Health & Dental Plan",
        website:
          "https://www.studentcare.ca/rte/en/UniversityofCalgaryStudentsUnion_Home",
        phone: "1-866-369-2800",
        coverage: {
          mentalHealth: "Up to $1,500/year for psychologists and counsellors",
          dental: "80% coverage up to $750/year",
          vision: "$200 every 24 months",
          prescription: "80% coverage",
        },
        note: "All undergraduate students enrolled in at least 2 courses are automatically enrolled.",
      },
      peerSupport: {
        name: "SU Peer Support Centre",
        description:
          "Free, confidential peer-to-peer support. Not a crisis line — for everyday stress, academic pressure, and mental health conversations.",
        services: [
          "One-on-one peer support sessions",
          "Group sessions",
          "Academic stress support",
          "Mental health peer support",
        ],
        website:
          "https://www.su.ucalgary.ca/programs-services/student-support/peer-support/",
      },
      qCentre: {
        name: "Q Centre",
        description:
          "Safe space and community hub for LGBTQ+ students and allies on campus.",
        website: "https://www.su.ucalgary.ca/programs-services/student-services/q-centre/",
        location: "MacEwan Student Centre",
      },
    };
  }

  // ─── GENERAL RESOURCES (SU portion) ──────────────────────────────────────

  getGeneralResources() {
    return {
      hardshipFund: {
        name: "SU Student Hardship Assistance Fund (SHAF)",
        description:
          "Last-resort financial help for undergraduate students facing unexpected, emergent circumstances. Student must have exhausted all other forms of student aid and emergency assistance before applying. Must have completed at least 9 credits and be currently enrolled.",
        howToApply:
          "Contact SHAF administrator Laura Brooks at laura.brooks@ucalgary.ca to begin the application.",
        email: "laura.brooks@ucalgary.ca",
        turnaround: "Inquiries take approximately 1–2 weeks for review",
        website: "https://su.ucalgary.ca/programs-services/funding-awards/hardship-fund/",
        eligibility: [
          "Completed at least 9 credits (3 half-courses) at UCalgary",
          "Currently enrolled in at least 1 course (or enrolled in upcoming session)",
          "Must have applied for all other forms of financial aid first",
        ],
      },
      foodBank: {
        name: "SU Campus Food Bank",
        description:
          "Free grocery hampers for students — no ID required, fully confidential. Hampers include perishables (fruit, vegetables, eggs, meat, bread) and non-perishables (cereal, canned goods, pasta, peanut butter).",
        location: "MacEwan Student Centre (MSC), Room 225",
        phone: "403-220-8599",
        email: "foodbank@ucalgary.ca",
        hours: "Monday–Friday, 10:00 AM – 4:00 PM",
        website: "https://www.su.ucalgary.ca/programs-services/student-services/food-bank/",
        note: "Vegetarian options available. Contents vary based on donations.",
      },
      advocacy: {
        name: "SU Student Advocacy",
        description:
          "Free support for academic appeals, grade disputes, and navigating university policies and processes.",
        phone: "403-220-6551",
        email: "reception@su.ucalgary.ca",
        location: "MacEwan Student Centre (MSC) 251",
        website:
          "https://www.su.ucalgary.ca/programs-services/student-support/student-advocacy/",
      },
      offCampusHousing: {
        name: "SU Off-Campus Housing",
        description:
          "Resources for students looking for housing, understanding tenant rights and responsibilities, and navigating rental agreements.",
        website:
          "https://www.su.ucalgary.ca/programs-services/student-support/off-campus-housing/",
      },
      denAffordableMeals: {
        name: "The Den – Affordable Meal Program",
        description:
          "The SU's on-campus restaurant offers an affordable meal program to help address food insecurity on campus.",
        location: "MacEwan Student Centre",
        website: "https://www.su.ucalgary.ca/",
      },
    };
  }

  // ─── LEGACY: kept for backward-compat with old chatbot controller ─────────

  getResources() {
    return {
      insurance: this.getWellnessResources().insurance,
      foodSecurity: this.getGeneralResources().foodBank,
      peerSupport: this.getWellnessResources().peerSupport,
      advocacy: this.getGeneralResources().advocacy,
      hardshipFund: this.getGeneralResources().hardshipFund,
    };
  }
}