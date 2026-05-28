import axios from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UCalgaryService {
  private cacheFile = path.join(__dirname, "../../src/data/ucalgary.json");
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // ─── HEALTH & WELLNESS ────────────────────────────────────────────────────

  getWellnessResourcesStatic() {
    return {
      mentalHealth: {
        name: "Student Wellness Services – Mental Health",
        phone: "403-210-9355",
        email: "swsmentalhealth@ucalgary.ca",
        website: "https://www.ucalgary.ca/wellness-services/services/mental-health-services",
        services: [
          "Free short-term counselling (up to 10 sessions)",
          "Crisis support",
          "Group therapy",
          "Wellness workshops",
          "Student Support Advising",
        ],
        hours: "Monday–Friday, 8:30 AM – 4:30 PM (after-hours crisis counsellor available via phone)",
        location: "MacEwan Student Centre, Room 370",
        bookingInfo: "Email swsmentalhealth@ucalgary.ca or call to schedule",
      },
      medicalClinic: {
        name: "Student Medical Clinic",
        phone: "403-210-9355",
        website: "https://www.ucalgary.ca/wellness-services/services/medical-services",
        services: [
          "Walk-in appointments",
          "STI testing and treatment",
          "Birth control counselling",
          "Vaccinations",
          "Prescription renewals",
        ],
        hours: "Monday–Friday, 9:00 AM – 4:00 PM",
        location: "MacEwan Student Centre, Room 370",
      },
      sexualViolenceSupport: {
        name: "Sexual Violence Support Advocate",
        phone: "403-220-2208",
        email: "svsa@ucalgary.ca",
        description:
          "Confidential support for members of the campus community related to sexual violence, survivor resources, and referrals.",
        website: "https://www.ucalgary.ca/student-services/sexual-violence-support",
      },
      campusSecurity: {
        name: "Campus Security",
        phone: "403-220-5333",
        available: "24/7",
        description:
          "Emergency response, Safe Walk program, and non-emergent incident reporting on campus.",
        safeWalk: "https://www.ucalgary.ca/risk/campus-security/your-safety/safewalk",
        nonEmergencyReport: "https://www.ucalgary.ca/risk/campus-security",
      },
      // AHS resources placed at bottom of Health & Wellness per product spec
      ahs: {
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
          description: "Free, confidential 24/7 mental health support and crisis intervention for Albertans",
          available: "24/7",
        },
        addictionHelpLine: {
          name: "AHS Addiction Help Line",
          phone: "1-866-332-2322",
          description: "24/7 support and referrals for substance use concerns. Translation services available.",
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
      },
    };
  }

  // ─── GENERAL RESOURCES (non-health) ──────────────────────────────────────

  getGeneralResourcesStatic() {
    return {
      financialAid: {
        category: "Financial Help",
        resources: [
          {
            name: "UCalgary Emergency Financial Assistance",
            description:
              "Emergency loans and bursaries for students facing unexpected financial hardship (e.g. theft, accidents, medical expenses). Cannot cover tuition. Contact an Enrolment Services Advisor first — they will refer you to the application if eligible.",
            phone: "403-210-7625",
            hours: "Monday–Friday, 9:00 AM – 4:30 PM",
            website:
              "https://www.ucalgary.ca/registrar/finances/student-loans/emergency-financial-assistance",
            howToApply:
              "Call or visit Enrolment Services; if eligible, you'll be given access to the application via my.ucalgary.ca",
            turnaround: "Typical response: 1–2 business days",
          },
          {
            name: "UCalgary Financial Aid (Government Loans & Bursaries)",
            description:
              "Government student assistance programs for Canadian citizens, permanent residents, protected persons, and American citizens. Also includes scholarships and university bursaries.",
            phone: "403-210-7625",
            location: "Hunter Student Commons, Room 220",
            website: "https://www.ucalgary.ca/registrar/finances/financial-aid",
          },
          {
            name: "Graduate Student Emergency Bursary",
            description:
              "For graduate students with unexpected, temporary financial need. Apply via the Graduate Students' Association (GSA).",
            website: "https://gsa.ucalgary.ca/financial-support/",
          },
        ],
      },
      legalHelp: {
        category: "Legal Help",
        resources: [
          {
            name: "Student Legal Assistance (SLA)",
            description:
              "On-campus law clinic staffed by UCalgary law students with advising lawyers. Provides free pro bono representation and legal assistance to UCalgary undergraduate students in civil, criminal, and family law matters. Also commissions documents and statutory declarations (free for undergrads, $10 for grad students).",
            phone: "403-220-6637",
            location: "Murray Fraser Hall (MFH) 3390",
            website: "https://slacalgary.com/",
            hours: "Evening clinics during academic year; daytime clinics in summer",
          },
          {
            name: "UCalgary Law – Pro Bono Legal Clinics",
            description:
              "Several low-cost or pro bono clinics including the Business Venture Clinic (for entrepreneurs/startups). Covers early financing, business structures, employment, IP, and liability.",
            website: "https://law.ucalgary.ca/legal-services",
          },
        ],
      },
      campusSafety: {
        category: "Campus Safety",
        resources: [
          {
            name: "Campus Security",
            phone: "403-220-5333",
            available: "24/7",
            description:
              "24/7 emergency response on campus. Also runs the Safe Walk program — a free escort service across campus at night.",
            safeWalk: "https://www.ucalgary.ca/risk/campus-security/your-safety/safewalk",
            nonEmergencyReport: "https://www.ucalgary.ca/risk/campus-security",
            note: "For non-emergent issues (lost/stolen property, vandalism, minor incidents) use the online reporting portal.",
          },
          {
            name: "Calgary Police Service",
            phone: "403-266-1234",
            emergency: "911",
            description: "24-hour emergency response. Use 911 for emergencies, non-emergency line for everything else.",
            onlineReport: "https://www.calgary.ca/cps.html",
          },
          {
            name: "Awo Taan Emergency Shelter (Domestic/Family Violence)",
            phone: "403-531-1972",
            altPhone: "403-531-1976",
            available: "24/7",
            description: "24/7 crisis line for students experiencing family violence, domestic violence, or homelessness.",
          },
          {
            name: "Calgary Communities Against Sexual Abuse (CCASA)",
            phone: "403-237-5888",
            description: "Support and information for those affected by sexual violence.",
          },
        ],
      },
      housingHelp: {
        category: "Housing Help",
        resources: [
          {
            name: "SU Off-Campus Housing",
            description:
              "Information on housing search, understanding tenant rights and responsibilities, and off-campus living resources.",
            website: "https://www.su.ucalgary.ca/programs-services/student-support/off-campus-housing/",
          },
          {
            name: "Calgary Emergency Shelters",
            description:
              "Individuals and families can access emergency shelters and temporary housing when facing family violence, domestic violence, or homelessness.",
            website: "https://www.ucalgary.ca/current-students/urgent-support",
            note: "See the UCalgary Urgent Support page for a current list of shelter resources.",
          },
        ],
      },
      foodSecurity: {
        category: "Food Security",
        resources: [
          {
            name: "Campus Food Hub",
            description:
              "A collaborative, student-centred space for food access and education. Helps address food insecurity with nutritious, affordable, and culturally appropriate food. Run by Student Experience & Support, Ancillary Services, SU, and GSA.",
            location: "University of Calgary Main Campus",
            website:
              "https://www.ucalgary.ca/career-personal-development/programs/student-life/campus-food-hub",
          },
        ],
      },
      urgentSupport: {
        category: "Urgent Support (All Issues)",
        description:
          "UCalgary's single resource page for urgent student needs across financial, wellness, academic, and safety issues.",
        website: "https://www.ucalgary.ca/current-students/urgent-support",
      },
    };
  }

  // ─── COMBINED / CACHED WELLNESS (for chatbot context) ────────────────────

  async getWellnessResources() {
    const cached = await this.loadCache();
    if (cached) return cached;

    const freshData = this.getWellnessResourcesStatic();
    await this.saveCache(freshData);
    return freshData;
  }

  private async loadCache() {
    try {
      const data = await fs.readFile(this.cacheFile, "utf-8");
      const parsed = JSON.parse(data);
      const age = Date.now() - new Date(parsed.cachedAt).getTime();
      if (age < this.cacheExpiry) {
        console.log("✅ Using cached UCalgary data");
        return parsed.data;
      }
      console.log("⏰ Cache expired, refreshing data");
    } catch {
      console.log("📥 No cache found, using static data");
    }
    return null;
  }

  private async saveCache(data: any) {
    try {
      const dataDir = path.dirname(this.cacheFile);
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify({ cachedAt: new Date().toISOString(), data }, null, 2)
      );
      console.log("✅ Cache saved");
    } catch (error: any) {
      console.error("⚠️ Cache save failed (non-critical):", error.message);
    }
  }
}