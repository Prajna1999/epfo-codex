"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../language";
import { writeAuthRole } from "./auth";
import { Icon } from "./Icon";
import { LanguageSwitch } from "./LanguageSwitch";
import { mockPassword, mockRoles, type MockRole } from "./mock-login-data";

type Role = MockRole;
type RecoveryType = "password" | "id";

const isSixDigitCode = (value: string) => /^\d{6}$/.test(value);

export function MockLogin() {
  const { t } = useLanguage();
  const router = useRouter();
  const [role, setRole] = useState<Role>("member");
  const [stage, setStage] = useState<"credentials" | "otp" | "loading">("credentials");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryType | null>(null);

  const sendOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStage("loading");
    window.setTimeout(() => setStage("otp"), 650);
  };

  const verifyOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSixDigitCode(otp)) return setOtpError(true);
    setStage("loading");
    window.setTimeout(() => {
      writeAuthRole(role);
      router.push("/");
    }, 1200);
  };

  if (recovery) return <RecoveryScreen role={role} type={recovery} onBack={() => setRecovery(null)} />;

  const currentRole = mockRoles[role];
  return <main className="login-shell">
    <div className="login-lang"><LanguageSwitch /></div>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand"><span className="service-mark" aria-hidden="true"><i /><i /><i /></span><div><strong>EPFO</strong><small>{t("Employees' Provident Fund Organisation")}</small></div></div>
      <p className="eyebrow">{t("SECURE ACCESS")}</p>
      <h1 id="login-title">{t("Sign in to EPFO")}</h1>
      <p className="login-intro">{t("Choose your account type to continue.")}</p>
      <div className="login-tabs" role="tablist" aria-label={t("Account type")}>
        {(Object.keys(mockRoles) as Role[]).map((item) => <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? "active" : ""} onClick={() => { setRole(item); setStage("credentials"); }}>{t(mockRoles[item].label)}</button>)}
      </div>
      {stage === "credentials" ? <form className="login-form" onSubmit={sendOtp}>
        <p className="login-role-copy">{t(currentRole.description)}</p>
        <label>{t(currentRole.identifier)}<input required inputMode={role === "member" ? "numeric" : "text"} defaultValue={currentRole.loginId} /></label>
        <label>{t("Password")}<input required type="password" defaultValue={mockPassword} /></label>
        <button className="primary-button login-submit" type="submit">{t("Login")}</button>
        <div className="login-links"><button type="button" onClick={() => setRecovery("password")}>{t("Forgot password")}</button><span aria-hidden="true">·</span><button type="button" onClick={() => setRecovery("id")}>{t("Forgot ID")}</button></div>
      </form> : stage === "otp" ? <form className="login-form" onSubmit={verifyOtp}>
        <div className="otp-notice"><Icon name="shield" size={18} /><span>{t("A one-time password was sent to your registered mobile number.")}</span></div>
        <label>{t("6-digit OTP")}<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(false); }} autoFocus /></label>
        <small className="mock-otp">{t("Prototype sign-in: any 6-digit code is accepted.")}</small>
        {otpError && <small className="otp-error">{t("Enter a 6-digit code to continue.")}</small>}
        <button className="primary-button login-submit" type="submit">{t("Verify and sign in")}</button>
        <button className="text-button" type="button" onClick={() => setStage("credentials")}>{t("Use a different account")}</button>
      </form> : <div className="login-loading" role="status" aria-live="polite"><span /><strong>{t("Verifying your details")}</strong><small>{t("This is a secure mock sign-in.")}</small></div>}
      <p className="login-note" id="login-mock-note">{t("Prototype only. Do not enter real credentials.")}</p>
    </section>
    <aside className="login-story"><div><p className="eyebrow">{t("MINISTRY OF LABOUR & EMPLOYMENT")}</p><h2>{t("Social Security, Peace of Mind")}</h2><p>{t("Your work history, savings and protection—connected through one account.")}</p></div><svg className="continuity-motif" viewBox="0 0 520 180" aria-hidden="true"><path d="M0 145C85 145 95 111 177 111s104 34 179 34 80-25 164-25" fill="none" stroke="#f4cfad" strokeWidth="2"/><path d="M0 151C85 151 95 117 177 117s104 34 179 34 80-25 164-25" fill="none" stroke="#ffffff54" strokeWidth="1"/><circle cx="406" cy="87" r="30" fill="#e88b39"/><path d="M406 43V24m31 32 13-13m-1 44h19m-31 31 13 13M375 118l-13 13m0-44h-19m32-31-13-13" stroke="#efb06e" strokeWidth="2" strokeLinecap="round"/><path d="M342 145c14-44 84-44 98 0" fill="none" stroke="#f7d3b0" strokeWidth="2"/></svg><small>{t("A calmer way to manage your provident fund.")}</small></aside>
  </main>;
}

function RecoveryScreen({ role, type, onBack }: { role: Role; type: RecoveryType; onBack: () => void }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<"details" | "pin" | "reset" | "complete" | "loading">("details");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const currentRole = mockRoles[role];
  const isMember = role === "member";
  const title = type === "password" ? t("Reset your password") : isMember ? t("Know your UAN") : t("Recover your login ID");
  const begin = (event: React.FormEvent<HTMLFormElement>, next: "pin" | "reset" | "complete" = "pin") => {
    event.preventDefault();
    setStage("loading");
    window.setTimeout(() => setStage(next === "pin" ? "pin" : next), 650);
  };
  const verifyPin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSixDigitCode(pin)) return setPinError(true);
    setStage("loading");
    window.setTimeout(() => setStage(type === "password" ? "reset" : "complete"), 650);
  };

  return <main className="login-shell recovery-shell">
    <div className="login-lang"><LanguageSwitch /></div>
    <section className="login-card recovery-card" aria-labelledby="recovery-title">
    <button className="recovery-back" type="button" onClick={onBack}>← {t("Back to sign in")}</button>
    <div className="login-brand"><span className="service-mark" aria-hidden="true"><i /><i /><i /></span><div><strong>EPFO</strong><small>{t("Employees' Provident Fund Organisation")}</small></div></div>
    <p className="eyebrow">{t("ACCOUNT RECOVERY")}</p><h1 id="recovery-title">{title}</h1>
    {stage === "details" && <form className="login-form" onSubmit={begin}>
      <p className="login-role-copy">{type === "password" ? t("We will verify your registered mobile number before continuing.") : isMember ? t("Find your UAN using details recorded with EPFO.") : t("We will send your login ID to your registered mobile number.")}</p>
      {type === "id" && isMember && <label>{t("Identify using")}<select defaultValue="Member ID"><option>Member ID</option><option>Aadhaar</option><option>PAN</option></select></label>}
      {type === "id" && isMember && <><label>{t("Full name")}<input required defaultValue="Rahul Patil" /></label><label>{t("Date of birth")}<input required type="date" defaultValue="1992-05-14" /></label></>}
      <label>{t(type === "password" || !isMember ? currentRole.identifier : "Mobile number")}<input required inputMode={type === "password" && isMember ? "numeric" : "text"} defaultValue={type === "password" || !isMember ? currentRole.loginId : "9876543210"} /></label>
      {type === "id" && isMember && <label>{t("Email address")}<input required type="email" defaultValue="rahul.patil@example.com" /></label>}
      {type === "password" && <label>{t("Registered mobile number")}<input required inputMode="numeric" defaultValue="9876543210" /></label>}
      <button className="primary-button login-submit" type="submit">{t("Send authorisation PIN")}</button>
    </form>}
    {stage === "pin" && <form className="login-form" onSubmit={verifyPin}><div className="otp-notice"><Icon name="shield" size={18} /><span>{t("An authorisation PIN was sent to your registered mobile number.")}</span></div><label>{t("Authorisation PIN")}<input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(false); }} autoFocus /></label><small className="mock-otp">{t("Prototype sign-in: any 6-digit code is accepted.")}</small>{pinError && <small className="otp-error">{t("Enter a 6-digit code to continue.")}</small>}<button className="primary-button login-submit" type="submit">{t("Verify PIN")}</button></form>}
    {stage === "reset" && <form className="login-form" onSubmit={(event) => begin(event, "complete")}><p className="login-role-copy">{t("Choose a new password for your account.")}</p><label>{t("New password")}<input required type="password" defaultValue={mockPassword} /></label><label>{t("Confirm new password")}<input required type="password" defaultValue={mockPassword} /></label><button className="primary-button login-submit" type="submit">{t("Reset password")}</button></form>}
    {stage === "complete" && <div className="recovery-complete"><span><Icon name="shield" size={22} /></span><h2>{type === "password" ? t("Password reset") : t("Your UAN has been sent")}</h2><p>{type === "password" ? t("Your password has been updated. You can now sign in.") : isMember ? t("Your UAN was sent to your registered mobile number.") : t("Your login ID was sent to your registered mobile number.")}</p><button className="primary-button login-submit" type="button" onClick={onBack}>{t("Return to sign in")}</button></div>}
    {stage === "loading" && <div className="login-loading" role="status" aria-live="polite"><span /><strong>{t("Checking your details")}</strong><small>{t("This is a secure mock recovery flow.")}</small></div>}
    <p className="login-note">{t("Prototype only. Do not enter real credentials.")}</p>
  </section></main>;
}
