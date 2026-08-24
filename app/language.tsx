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
  Member: { en: "Member", hi: "Member" },
  "All extensions": { en: "All extensions", hi: "Saari extensions" },
  "Authorized Signatory": { en: "Authorized Signatory", hi: "Authorized Signatory" },
  Overview: { en: "Overview", hi: "Overview" },
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