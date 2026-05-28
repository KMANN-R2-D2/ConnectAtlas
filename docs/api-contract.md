# API Contract — Healthcare Support Chatbot  
_Last updated: 2025-11-23_

This document defines the API contract between the **frontend interface** and the **backend service** for the Healthcare Support Chatbot inspired by friend.com.  
The backend integrates with:
- Alberta Health Services (AHS) resources  
- University of Calgary (UCalgary) health & wellness pages  
- Student Union (SU) student-support services  
- The Friend Open Source API (for natural-language generation)

---

# 1. Overview

The system exposes a single chat endpoint that:
1. Receives a user message  
2. Sends it to the LLM (Friend API or local model)  
3. Optionally calls local resource-matching modules  
4. Returns chatbot text + structured resource recommendations

All calls use `application/json`.

---

# 2. Base URL

During local development:

http://localhost:3000

Production URL: TBD


---

# 3. Endpoints

## **POST /api/chat**

### **Description**
Processes a user message and returns:
- LLM-generated supportive text
- A list of relevant AHS/UCalgary/SU resources

### **Request Body**

```json
{
  "message": "I feel anxious",
  "userId": "optional-user-id",
  "context": {
    "conversationId": "optional-conversation-id",
    "previous": []
  }
}

{
  "text": "I'm sorry you're feeling anxious. You're not alone. Here are some supports that might help:",
  "resources": [
    {
      "name": "UCalgary Student Wellness Services",
      "description": "Mental health counselling, same-day support, workshops.",
      "url": "https://www.ucalgary.ca/wellness-services",
      "type": "university"
    },
    {
      "name": "AHS Mental Health Helpline",
      "description": "24/7 support line for mental health concerns.",
      "url": "https://www.albertahealthservices.ca/amh/amh.aspx",
      "type": "ahs"
    }
  ],
  "meta": {
    "model": "friend-api-v1",
    "time": "2025-11-23T18:20:25Z"
  }
}

{
  "error": "Missing field: message"
}

{
  "error": "Unexpected backend failure. Please try again."
}

End of API Contract
