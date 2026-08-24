"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict: Record<string, { en: string; hi: string }> = {
  "Open navigation": { en: "Open navigation", hi: "Navigation kholen" },
  "Close navigation": { en: "Close navigation", hi: "Navigation band karein" },
  "Main navigation": { en: "Main navigation", hi: "Main navigation" },
  Close: { en: "Close", hi: "Band karein" },
  Contribution: { en: "Contribution", hi: "Contribution" },
  "Search EPFO services": { en: "Search EPFO services", hi: "EPFO services khojiye" },
  "Search services": { en: "Search services", hi: "Services khojiye" },
  Notifications: { en: "Notifications", hi: "Notifications" },
  "Verified account": { en: "Verified account", hi: "Verified account" },
  "Currently acting as": { en: "Currently acting as", hi: "Abhi aap acting as" },
  "Need help?": { en: "Need help?", hi: "Madad chahiye?" },
  "Guides and support": { en: "Guides and support", hi: "Guides aur support" },
  "Acting as": { en: "Acting as", hi: "Abhi aap acting as" },
  "MONDAY, 24 AUGUST": { en: "MONDAY, 24 AUGUST", hi: "SOMVAAR, 24 AUGUST" },
  "Good afternoon, Rahul": { en: "Good afternoon, Rahul", hi: "Shubh dopahar, Rahul" },
  "Here’s a clear view of your provident fund.": { en: "Here’s a clear view of your provident fund.", hi: "Yahan aapka provident fund saaf-saaf dikh raha hai." },
  "Here’s what needs attention at {name}.": { en: "Here’s what needs attention at {name}.", hi: "{name} pe aapka dhyan chahiye." },
  "Download statement": { en: "Download statement", hi: "Statement download karein" },
  "Download report": { en: "Download report", hi: "Report download karein" },
  "Return to overview": { en: "Return to overview", hi: "Overview pe wapas jayein" },
  "This workspace is ready for the {item} journey. Your active role and scope remain visible while you work.": { en: "This workspace is ready for the {item} journey. Your active role and scope remain visible while you work.", hi: "{item} ke kaam ke liye ye workspace taiyaar hai. Aapka active role aur scope dikhta rahega." },
  "Switch context": { en: "Switch context", hi: "Context badlein" },
  "Choose who you want to act as. You won’t need to sign in again.": { en: "Choose who you want to act as. You won’t need to sign in again.", hi: "Chuniye ki aap kiske roop mein kaam karna chahte hain. Dubara sign-in nahi karna padega." },
  Current: { en: "Current", hi: "Current" },
  "Sensitive actions may require an OTP or e-Sign confirmation.": { en: "Sensitive actions may require an OTP or e-Sign confirmation.", hi: "Kuch kaam karne ke liye OTP ya e-Sign confirmation zaroori ho sakta hai." },
  "My PF": { en: "My PF", hi: "Mera PF" },
  "My retirement account": { en: "My retirement account", hi: "Mera retirement account" },
  "Your retirement account": { en: "Your retirement account", hi: "Aapka retirement account" },
  Personal: { en: "Personal", hi: "Personal" },
  "Personal account": { en: "Personal account", hi: "Personal account" },
  Member: { en: "Member", hi: "Member" },
  "All extensions": { en: "All extensions", hi: "Saari extensions" },
  "Authorized Signatory": { en: "Authorized Signatory", hi: "Authorized Signatory" },
  Overview: { en: "Overview", hi: "Overview" },
  Home: { en: "Home", hi: "Home" },
  Money: { en: "Money", hi: "Paisa" },
  Employment: { en: "Employment", hi: "Naukri" },
  Withdraw: { en: "Withdraw", hi: "Paisa nikalein" },
  Account: { en: "Account", hi: "Account" },
  "Return home": { en: "Return home", hi: "Home par wapas jayein" },
  "Aadhaar verified": { en: "Aadhaar verified", hi: "Aadhaar verified" },
  "Your retirement savings, contributions and withdrawals in one place.": { en: "Your retirement savings, contributions and withdrawals in one place.", hi: "Aapki retirement savings, contributions aur withdrawals, sab ek jagah." },
  "RETIREMENT ACCOUNT": { en: "RETIREMENT ACCOUNT", hi: "RETIREMENT ACCOUNT" },
  "Total PF balance": { en: "Total PF balance", hi: "Kul PF balance" },
  "This is your recorded PF balance, not an immediately withdrawable amount.": { en: "This is your recorded PF balance, not an immediately withdrawable amount.", hi: "Yeh aapka recorded PF balance hai, turant nikali ja sakne wali rakam nahi." },
  "Recorded balance · Updated 18 Aug 2026": { en: "Recorded balance · Updated 18 Aug 2026", hi: "Recorded balance · 18 Aug 2026 ko update hua" },
  "Your contributions": { en: "Your contributions", hi: "Aapka contribution" },
  "Employer contributions": { en: "Employer contributions", hi: "Employer ka contribution" },
  "ACCOUNT HEALTH": { en: "ACCOUNT HEALTH", hi: "ACCOUNT KI STITHI" },
  "Everything is on track": { en: "Everything is on track", hi: "Sab kuch sahi chal raha hai" },
  "Your latest contribution arrived and your essential details are verified.": { en: "Your latest contribution arrived and your essential details are verified.", hi: "Aapka latest contribution aa gaya hai aur zaroori details verified hain." },
  "August contribution received": { en: "August contribution received", hi: "August ka contribution mil gaya" },
  "Aadhaar and bank verified": { en: "Aadhaar and bank verified", hi: "Aadhaar aur bank verified" },
  "Nominee registered": { en: "Nominee registered", hi: "Nominee registered hai" },
  "Previous PF transferred": { en: "Previous PF transferred", hi: "Purana PF transfer ho gaya" },
  "View account health": { en: "View account health", hi: "Account ki stithi dekhein" },
  "LATEST CONTRIBUTION": { en: "LATEST CONTRIBUTION", hi: "LATEST CONTRIBUTION" },
  "Deposited 18 August": { en: "Deposited 18 August", hi: "18 August ko deposit hua" },
  Confirmed: { en: "Confirmed", hi: "Confirm ho gaya" },
  "Move and manage your money": { en: "Move and manage your money", hi: "Apna paisa dekhein aur manage karein" },
  "Official EPFO services, in plain language": { en: "Official EPFO services, in plain language", hi: "Official EPFO services, aasaan bhasha mein" },
  "File a Claim": { en: "File a Claim", hi: "Claim file karein" },
  "Start a new PF claim": { en: "Start a new PF claim", hi: "Naya PF claim shuru karein" },
  "Back to dashboard": { en: "Back to dashboard", hi: "Dashboard par wapas jayein" },
  "Submit a claim": { en: "Submit a claim", hi: "Claim submit karein" },
  "Answer only what is needed. We’ll prepare the right EPFO form for you.": { en: "Answer only what is needed. We’ll prepare the right EPFO form for you.", hi: "Sirf zaroori sawaalon ka jawab dein. Hum aapke liye sahi EPFO form taiyaar karenge." },
  "Choose claim": { en: "Choose claim", hi: "Claim chunein" },
  "Confirm details": { en: "Confirm details", hi: "Details confirm karein" },
  "Claim questions": { en: "Claim questions", hi: "Claim ke sawaal" },
  "Review and submit": { en: "Review and submit", hi: "Review karke submit karein" },
  "Complete the required fields to continue.": { en: "Complete the required fields to continue.", hi: "Aage badhne ke liye zaroori fields poore karein." },
  "Confirm your bank account and enter the 6-digit OTP.": { en: "Confirm your bank account and enter the 6-digit OTP.", hi: "Bank account confirm karke 6-digit OTP daalein." },
  Back: { en: "Back", hi: "Wapas" },
  Continue: { en: "Continue", hi: "Aage badhein" },
  "Submit claim": { en: "Submit claim", hi: "Claim submit karein" },
  "What would you like to claim?": { en: "What would you like to claim?", hi: "Aap kaunsa claim karna chahte hain?" },
  "Choose one option. You can review everything before submitting.": { en: "Choose one option. You can review everything before submitting.", hi: "Ek option chunein. Submit karne se pehle sab review kar sakte hain." },
  "PF advance": { en: "PF advance", hi: "PF advance" },
  "Withdraw part of your PF for an eligible need": { en: "Withdraw part of your PF for an eligible need", hi: "Eligible zaroorat ke liye PF ka kuch hissa nikalein" },
  "Final PF settlement": { en: "Final PF settlement", hi: "Final PF settlement" },
  "Settle your PF after leaving employment": { en: "Settle your PF after leaving employment", hi: "Naukri chhodne ke baad PF settle karein" },
  "Pension benefit": { en: "Pension benefit", hi: "Pension benefit" },
  "Request an EPS benefit or scheme certificate": { en: "Request an EPS benefit or scheme certificate", hi: "EPS benefit ya scheme certificate maangein" },
  "Confirm your details": { en: "Confirm your details", hi: "Apni details confirm karein" },
  "These details come from your UAN and verified KYC records.": { en: "These details come from your UAN and verified KYC records.", hi: "Ye details aapke UAN aur verified KYC records se aayi hain." },
  UAN: { en: "UAN", hi: "UAN" },
  Employer: { en: "Employer", hi: "Employer" },
  "Date of joining": { en: "Date of joining", hi: "Joining ki tareekh" },
  "Date of leaving": { en: "Date of leaving", hi: "Leaving ki tareekh" },
  "Currently employed": { en: "Currently employed", hi: "Abhi naukri mein hain" },
  "Bank account": { en: "Bank account", hi: "Bank account" },
  "These details are correct": { en: "These details are correct", hi: "Ye details sahi hain" },
  "A few details about your claim": { en: "A few details about your claim", hi: "Aapke claim ke baare mein kuch details" },
  "We only ask questions needed for your selected claim.": { en: "We only ask questions needed for your selected claim.", hi: "Hum sirf aapke chune hue claim ke zaroori sawaal poochte hain." },
  "Purpose of advance": { en: "Purpose of advance", hi: "Advance ka purpose" },
  "Select a purpose": { en: "Select a purpose", hi: "Purpose chunein" },
  "Amount requested": { en: "Amount requested", hi: "Maangi gayi rakam" },
  Illness: { en: "Illness", hi: "Bimari" },
  Housing: { en: "Housing", hi: "Ghar" },
  Marriage: { en: "Marriage", hi: "Shaadi" },
  Education: { en: "Education", hi: "Padhai" },
  "Natural calamity": { en: "Natural calamity", hi: "Prakritik aapda" },
  "Electricity cut": { en: "Electricity cut", hi: "Bijli cut" },
  "Assistive equipment": { en: "Assistive equipment", hi: "Sahayak equipment" },
  "Patient and relationship": { en: "Patient and relationship", hi: "Patient aur rishta" },
  "Housing requirement": { en: "Housing requirement", hi: "Ghar ki zaroorat" },
  "Beneficiary and relationship": { en: "Beneficiary and relationship", hi: "Beneficiary aur rishta" },
  "Student and course": { en: "Student and course", hi: "Student aur course" },
  "Date and place affected": { en: "Date and place affected", hi: "Prabhavit tareekh aur jagah" },
  "Outage period": { en: "Outage period", hi: "Bijli band rehne ka samay" },
  "Equipment required": { en: "Equipment required", hi: "Zaroori equipment" },
  "Tax declaration": { en: "Tax declaration", hi: "Tax declaration" },
  "Select one": { en: "Select one", hi: "Ek chunein" },
  "Not applicable": { en: "Not applicable", hi: "Laagu nahi" },
  "Choose Form 15G or 15H only if it applies to your tax situation.": { en: "Choose Form 15G or 15H only if it applies to your tax situation.", hi: "Form 15G ya 15H tabhi chunein jab aapki tax situation mein laagu ho." },
  "Withdrawal benefit": { en: "Withdrawal benefit", hi: "Withdrawal benefit" },
  "Scheme certificate": { en: "Scheme certificate", hi: "Scheme certificate" },
  "Receive the eligible pension withdrawal amount": { en: "Receive the eligible pension withdrawal amount", hi: "Eligible pension withdrawal amount paayein" },
  "Preserve your pension service for the future": { en: "Preserve your pension service for the future", hi: "Pension service ko future ke liye bachayein" },
  "We generated the required legacy form data from your answers.": { en: "We generated the required legacy form data from your answers.", hi: "Aapke jawaabon se zaroori purane form ka data taiyaar ho gaya hai." },
  "Claim type": { en: "Claim type", hi: "Claim type" },
  "EPFO form": { en: "EPFO form", hi: "EPFO form" },
  "Claim details": { en: "Claim details", hi: "Claim details" },
  "Payment account": { en: "Payment account", hi: "Payment account" },
  "I confirm this bank account for payment": { en: "I confirm this bank account for payment", hi: "Main payment ke liye is bank account ko confirm karta hoon" },
  "Aadhaar verification": { en: "Aadhaar verification", hi: "Aadhaar verification" },
  "An OTP will be sent to your Aadhaar-linked mobile number ending 8842.": { en: "An OTP will be sent to your Aadhaar-linked mobile number ending 8842.", hi: "OTP aapke Aadhaar-linked mobile number 8842 par bheja jayega." },
  "Send OTP": { en: "Send OTP", hi: "OTP bhejein" },
  "6-digit OTP": { en: "6-digit OTP", hi: "6-digit OTP" },
  "CLAIM SUBMITTED": { en: "CLAIM SUBMITTED", hi: "CLAIM SUBMIT HO GAYA" },
  "Your claim has been submitted": { en: "Your claim has been submitted", hi: "Aapka claim submit ho gaya hai" },
  "EPFO will review your claim. You can track its progress from Past Claim Status.": { en: "EPFO will review your claim. You can track its progress from Past Claim Status.", hi: "EPFO aapka claim review karega. Past Claim Status se progress track kar sakte hain." },
  "Claim reference": { en: "Claim reference", hi: "Claim reference" },
  "Past Claim Status": { en: "Past Claim Status", hi: "Purane claim ka status" },
  "Track your previous claims": { en: "Track your previous claims", hi: "Apne purane claims track karein" },
  "View Passbook": { en: "View Passbook", hi: "Passbook dekhein" },
  "Your PF credits and debits in one place.": { en: "Your PF credits and debits in one place.", hi: "Aapke PF credits aur debits, ek jagah." },
  "Member ID": { en: "Member ID", hi: "Member ID" },
  "Financial year": { en: "Financial year", hi: "Financial year" },
  Date: { en: "Date", hi: "Tareekh" },
  Particulars: { en: "Particulars", hi: "Vivaran" },
  Credit: { en: "Credit", hi: "Credit" },
  Debit: { en: "Debit", hi: "Debit" },
  "Opening balance": { en: "Opening balance", hi: "Shuruaati balance" },
  "Total credits": { en: "Total credits", hi: "Kul credits" },
  "Total debits": { en: "Total debits", hi: "Kul debits" },
  "Closing balance": { en: "Closing balance", hi: "Antim balance" },
  "View transactions": { en: "View transactions", hi: "Transactions dekhein" },
  "See every contribution and credit": { en: "See every contribution and credit", hi: "Har contribution aur credit dekhein" },
  "Check withdrawal eligibility": { en: "Check withdrawal eligibility", hi: "Withdrawal eligibility check karein" },
  "Know what you can withdraw first": { en: "Know what you can withdraw first", hi: "Pehle jaanein ki kitna nikal sakte hain" },
  "Bring old PF together": { en: "Bring old PF together", hi: "Purana PF saath laayein" },
  "Transfer a previous account": { en: "Transfer a previous account", hi: "Pichhla account transfer karein" },
  MONEY: { en: "MONEY", hi: "PAISA" },
  "Recent activity": { en: "Recent activity", hi: "Haal ke transactions" },
  "View all transactions": { en: "View all transactions", hi: "Saare transactions dekhein" },
  "August contribution": { en: "August contribution", hi: "August ka contribution" },
  "July contribution": { en: "July contribution", hi: "July ka contribution" },
  "Annual interest credit": { en: "Annual interest credit", hi: "Saalana interest credit" },
  WITHDRAWAL: { en: "WITHDRAWAL", hi: "WITHDRAWAL" },
  "Medical advance": { en: "Medical advance", hi: "Medical advance" },
  "Submitted 12 Aug · HDFC Bank •••• 4821": { en: "Submitted 12 Aug · HDFC Bank •••• 4821", hi: "12 Aug ko submit hua · HDFC Bank •••• 4821" },
  Verified: { en: "Verified", hi: "Verified" },
  "No action needed.": { en: "No action needed.", hi: "Aapko kuch karne ki zaroorat nahi." },
  "EPFO is reviewing your request. Your employer verification is complete.": { en: "EPFO is reviewing your request. Your employer verification is complete.", hi: "EPFO aapki request review kar raha hai. Employer verification complete hai." },
  "Track withdrawal": { en: "Track withdrawal", hi: "Withdrawal track karein" },
  EMPLOYMENT: { en: "EMPLOYMENT", hi: "NAUKRI" },
  "Your PF follows you across jobs": { en: "Your PF follows you across jobs", hi: "Naukri badalne par bhi aapka PF aapke saath rehta hai" },
  "View employment history": { en: "View employment history", hi: "Naukri ki history dekhein" },
  "Current · Contributions arriving normally": { en: "Current · Contributions arriving normally", hi: "Current · Contributions theek se aa rahe hain" },
  "PF transferred": { en: "PF transferred", hi: "PF transfer ho gaya" },
  "UAN card": { en: "UAN card", hi: "UAN card" },
  "View UAN card": { en: "View UAN card", hi: "UAN card dekhein" },
  Balance: { en: "Balance", hi: "Balance" },
  "Flip back to balance": { en: "Flip back to balance", hi: "Balance par wapas jayein" },
  "Download UAN card as PDF": { en: "Download UAN card as PDF", hi: "UAN card PDF download karein" },
  "Universal Account Number": { en: "Universal Account Number", hi: "Universal Account Number" },
  Name: { en: "Name", hi: "Naam" },
  "Father's Name": { en: "Father's Name", hi: "Pita ka naam" },
  "KYC Status": { en: "KYC Status", hi: "KYC status" },
  Yes: { en: "Yes", hi: "Haan" },
  Photograph: { en: "Photograph", hi: "Photo" },
  "Issued 24 Aug 2026": { en: "Issued 24 Aug 2026", hi: "24 Aug 2026 ko issue hua" },
  "PF BALANCE": { en: "PF BALANCE", hi: "PF BALANCE" },
  "View UAN ID card": { en: "View UAN ID card", hi: "UAN ID card dekhein" },
  "UAN ID card": { en: "UAN ID card", hi: "UAN ID card" },
  "Back to PF balance": { en: "Back to PF balance", hi: "PF balance par wapas jayein" },
  "Download PDF": { en: "Download PDF", hi: "PDF download karein" },
  "My employment": { en: "My employment", hi: "Meri naukri" },
  Passbook: { en: "Passbook", hi: "Passbook" },
  Claims: { en: "Claims", hi: "Claim" },
  "KYC & profile": { en: "KYC & profile", hi: "KYC aur profile" },
  Nomination: { en: "Nomination", hi: "Nomination" },
  Documents: { en: "Documents", hi: "Documents" },
  Employees: { en: "Employees", hi: "Karmachari" },
  "ECR & contributions": { en: "ECR & contributions", hi: "ECR aur contribution" },
  Payments: { en: "Payments", hi: "Bhugtan" },
  Compliance: { en: "Compliance", hi: "Compliance" },
  Reports: { en: "Reports", hi: "Reports" },
  "Users & access": { en: "Users & access", hi: "Users aur access" },
  "Your total PF balance": { en: "Your total PF balance", hi: "Aapka total PF balance" },
  "₹8,430 contribution in August": { en: "₹8,430 contribution in August", hi: "August mein ₹8,430 contribution" },
  "Last updated 18 Aug 2026": { en: "Last updated 18 Aug 2026", hi: "Aakhri update 18 Aug 2026" },
  "Employee share": { en: "Employee share", hi: "Employee ka hissa" },
  "Employer share": { en: "Employer share", hi: "Employer ka hissa" },
  "Quick actions": { en: "Quick actions", hi: "Jaldi ke kaam" },
  "Most-used services": { en: "Most-used services", hi: "Sabse zyada use hone wali services" },
  "View passbook": { en: "View passbook", hi: "Passbook dekhein" },
  "See every contribution": { en: "See every contribution", hi: "Har contribution dekhein" },
  "Withdraw / claim PF": { en: "Withdraw / claim PF", hi: "PF nikalwayein / claim karein" },
  "Start or track a claim": { en: "Start or track a claim", hi: "Claim shuru karein ya track karein" },
  "Update KYC": { en: "Update KYC", hi: "KYC update karein" },
  "Keep details verified": { en: "Keep details verified", hi: "Details verified rakhein" },
  "Add nomination": { en: "Add nomination", hi: "Nomination add karein" },
  "Protect your family": { en: "Protect your family", hi: "Apne parivaar ko surakshit karein" },
  "MY EMPLOYMENT": { en: "MY EMPLOYMENT", hi: "MERI NAUKRI" },
  "3 linked employers": { en: "3 linked employers", hi: "3 jude hue employers" },
  "View all": { en: "View all", hi: "Sab dekhein" },
  "Current employment": { en: "Current employment", hi: "Abhi ki naukri" },
  "PF transferred successfully": { en: "PF transferred successfully", hi: "PF successfully transfer ho gaya" },
  Transferred: { en: "Transferred", hi: "Transfer ho gaya" },
  Active: { en: "Active", hi: "Active" },
  "LATEST CLAIM": { en: "LATEST CLAIM", hi: "NAYA CLAIM" },
  "Claim progress": { en: "Claim progress", hi: "Claim ki progress" },
  "In review": { en: "In review", hi: "Review mein" },
  "Advance claim · Submitted 12 Aug": { en: "Advance claim · Submitted 12 Aug", hi: "Advance claim · 12 Aug ko submit hua" },
  Submitted: { en: "Submitted", hi: "Submit ho gaya" },
  Verification: { en: "Verification", hi: "Verification" },
  Review: { en: "Review", hi: "Review" },
  Paid: { en: "Paid", hi: "Paid" },
  "Your employer verification is complete. EPFO review is in progress.": { en: "Your employer verification is complete. EPFO review is in progress.", hi: "Aapke employer ki verification complete ho gayi hai. EPFO review chal raha hai." },
  "Active employees": { en: "Active employees", hi: "Active karmachari" },
  "+42 this month": { en: "+42 this month", hi: "Is mahine +42" },
  "ECR status": { en: "ECR status", hi: "ECR status" },
  "Payment due 15 Sep": { en: "Payment due 15 Sep", hi: "Payment 15 Sep tak" },
  Good: { en: "Good", hi: "Achha" },
  "No action required": { en: "No action required", hi: "Koi action zaroori nahi" },
  "Contribution filing": { en: "Contribution filing", hi: "Contribution filing" },
  "Employees included": { en: "Employees included", hi: "Kitne karmachari" },
  "Gross wages": { en: "Gross wages", hi: "Gross wages" },
  "Submission signed by the Authorized Signatory on 18 August.": { en: "Submission signed by the Authorized Signatory on 18 August.", hi: "Submission Authorized Signatory ne 18 August ko sign kiya." },
  ATTENTION: { en: "ATTENTION", hi: "DHYAAN DEIN" },
  "Tasks to complete": { en: "Tasks to complete", hi: "Kaam baaki hain" },
  "Awaiting employer approval": { en: "Awaiting employer approval", hi: "Employer ki approval ka intezaar" },
  "Last working day to confirm": { en: "Last working day to confirm", hi: "Aakhri working day pe confirm karein" },
  "RECENT ACTIVITY": { en: "RECENT ACTIVITY", hi: "HAL KI ACTIVITY" },
  "August ECR submitted": { en: "August ECR submitted", hi: "August ECR submit hua" },
  "July payment reconciled": { en: "July payment reconciled", hi: "July ka payment reconcile hua" },
  Complete: { en: "Complete", hi: "Complete" },
  Matched: { en: "Matched", hi: "Match ho gaya" },
};

const STORAGE_KEY = "epfo.lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (text: string) => string;
  tpl: (key: string, params?: Record<string, string>) => string;
};

function subscribeLanguage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readLanguage(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "hi" ? "hi" : "en";
}

function readLanguageServer(): Lang {
  return "en";
}

function writeLanguage(lang: Lang) {
  window.localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event("storage"));
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLanguage, readLanguage, readLanguageServer);

  const setLang = useCallback((next: Lang) => writeLanguage(next), []);
  const toggle = useCallback(() => writeLanguage(lang === "en" ? "hi" : "en"), [lang]);

  const t = useCallback((text: string) => dict[text]?.[lang] ?? text, [lang]);

  const tpl = useCallback(
    (key: string, params?: Record<string, string>) => {
      let out = dict[key]?.[lang] ?? key;
      if (params) {
        for (const [paramKey, value] of Object.entries(params)) {
          out = out.replaceAll(`{${paramKey}}`, value);
        }
      }
      return out;
    },
    [lang],
  );

  return <LanguageContext.Provider value={{ lang, setLang, toggle, t, tpl }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
