"use client";

import { useLanguage } from "../language";
import { Icon } from "./Icon";
import styles from "./account-profile.module.css";

const personalDetails = [
  ["Name", "Rahul Patil"],
  ["Universal Account Number", "1009 2000 0123"],
  ["Date of birth", "14 May 1992"],
  ["Gender", "Male"],
  ["Father's name", "Madhav Patil"],
  ["Marital status", "Married"],
];

const contactDetails = [
  ["Mobile number", "+91 98••• 8842"],
  ["Email ID", "rahul.patil@example.com"],
  ["Correspondence address", "A-402, Green Meadows, Whitefield, Bengaluru, Karnataka 560066"],
  ["Permanent address", "12 Shastri Nagar, Pune, Maharashtra 411005"],
];

export function AccountProfile() {
  const { t } = useLanguage();
  return <section className={styles.profile} aria-label={t("Profile details")}><article className={styles.identity}><span><Icon name="user" size={22} /></span><div><p className="eyebrow">{t("MEMBER PROFILE")}</p><h2>Rahul Patil</h2><p>{t("Aadhaar verified")} · UAN 1009 2000 0123</p></div></article><ProfileSection title="Personal details" fields={personalDetails} /><ProfileSection title="Contact details" fields={contactDetails} /><p className={styles.note}><Icon name="shield" size={16} />{t("Profile updates use Aadhaar verification first. Review is only needed when it cannot confirm the change.")}</p></section>;
}

function ProfileSection({ title, fields }: { title: string; fields: string[][] }) {
  const { t } = useLanguage();
  return <section className={styles.section}><h2>{t(title)}</h2><dl>{fields.map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{value}</dd></div>)}</dl></section>;
}
