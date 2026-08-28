"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import { EmployerPortal } from "./EmployerPortal";
import { Icon } from "./Icon";
import { isMockOtp, mockPassword, mockRoles, type MockRole } from "./mock-login-data";
import { Portal } from "./Portal";

type Role = MockRole;
type RecoveryType = "password" | "id";

export function MockLogin({ initialNav, initialClaimsTab, initialClaimId, initialMemberId, initialProfileSection }: { initialNav: string; initialClaimsTab: "start" | "status"; initialClaimId?: string; initialMemberId?: string; initialProfileSection?: string }) {
  const { t } = useLanguage();
  const [role, setRole] = useState<Role>("member");
  const [stage, setStage] = useState<"credentials" | "otp" | "loading">("credentials");
  const [signedInAs, setSignedInAs] = useState<Role | null>(null);
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
    if (!isMockOtp(otp)) return setOtpError(true);
    setStage("loading");
    window.setTimeout(() => {
      setSignedInAs(role);
    }, 1200);
  };

  if (signedInAs === "member") return <Portal initialNav={initialNav} initialClaimsTab={initialClaimsTab} initialClaimId={initialClaimId} initialMemberId={initialMemberId} initialProfileSection={initialProfileSection} onLogout={() => setSignedInAs(null)} />;
  if (signedInAs) return <EmployerPortal role={signedInAs} onLogout={() => setSignedInAs(null)} />;
  if (recovery) return <RecoveryScreen role={role} type={recovery} onBack={() => setRecovery(null)} />;

  const currentRole = mockRoles[role];
  return <main className="login-shell">
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-brand"><span className="national-mark">अ</span><div><strong>EPFO</strong><small>{t("Employees' Provident Fund Organisation")}</small></div></div>
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
        <label>{t("6-digit OTP")}<input required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="123456" value={otp} onChange={(event) => { setOtp(event.target.value); setOtpError(false); }} autoFocus /></label>
        <small className="mock-otp">{t("Mock OTP: 123456")}</small>
        {otpError && <small className="otp-error">{t("Enter the mock OTP shown above.")}</small>}
        <button className="primary-button login-submit" type="submit">{t("Verify and sign in")}</button>
        <button className="text-button" type="button" onClick={() => setStage("credentials")}>{t("Use a different account")}</button>
      </form> : <div className="login-loading" role="status" aria-live="polite"><span /><strong>{t("Verifying your details")}</strong><small>{t("This is a secure mock sign-in.")}</small></div>}
      <p className="login-note" id="login-mock-note">{t("Prototype only. Do not enter real credentials.")}</p>
    </section>
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
    if (!isMockOtp(pin)) return setPinError(true);
    setStage("loading");
    window.setTimeout(() => setStage(type === "password" ? "reset" : "complete"), 650);
  };

  return <main className="login-shell"><section className="login-card recovery-card" aria-labelledby="recovery-title">
    <button className="recovery-back" type="button" onClick={onBack}>← {t("Back to sign in")}</button>
    <div className="login-brand"><span className="national-mark">अ</span><div><strong>EPFO</strong><small>{t("Employees' Provident Fund Organisation")}</small></div></div>
    <p className="eyebrow">{t("ACCOUNT RECOVERY")}</p><h1 id="recovery-title">{title}</h1>
    {stage === "details" && <form className="login-form" onSubmit={begin}>
      <p className="login-role-copy">{type === "password" ? t("We will verify your registered mobile number before continuing.") : isMember ? t("Find your UAN using details recorded with EPFO.") : t("We will send your login ID to your registered mobile number.")}</p>
      {type === "id" && isMember && <label>{t("Identify using")}<select defaultValue="Member ID"><option>Member ID</option><option>Aadhaar</option><option>PAN</option></select></label>}
      {type === "id" && isMember && <><label>{t("Full name")}<input required defaultValue="Rahul Patil" /></label><label>{t("Date of birth")}<input required type="date" defaultValue="1992-06-14" /></label></>}
      <label>{t(type === "password" || !isMember ? currentRole.identifier : "Mobile number")}<input required inputMode={type === "password" && isMember ? "numeric" : "text"} defaultValue={type === "password" || !isMember ? currentRole.loginId : "9876543210"} /></label>
      {type === "id" && isMember && <label>{t("Email address")}<input required type="email" defaultValue="rahul.patil@example.com" /></label>}
      {type === "password" && <label>{t("Registered mobile number")}<input required inputMode="numeric" defaultValue="9876543210" /></label>}
      <button className="primary-button login-submit" type="submit">{t("Send authorisation PIN")}</button>
    </form>}
    {stage === "pin" && <form className="login-form" onSubmit={verifyPin}><div className="otp-notice"><Icon name="shield" size={18} /><span>{t("An authorisation PIN was sent to your registered mobile number.")}</span></div><label>{t("Authorisation PIN")}<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(event) => { setPin(event.target.value); setPinError(false); }} autoFocus /></label><small className="mock-otp">{t("Mock OTP: 123456")}</small>{pinError && <small className="otp-error">{t("Enter the mock OTP shown above.")}</small>}<button className="primary-button login-submit" type="submit">{t("Verify PIN")}</button></form>}
    {stage === "reset" && <form className="login-form" onSubmit={(event) => begin(event, "complete")}><p className="login-role-copy">{t("Choose a new password for your account.")}</p><label>{t("New password")}<input required type="password" defaultValue={mockPassword} /></label><label>{t("Confirm new password")}<input required type="password" defaultValue={mockPassword} /></label><button className="primary-button login-submit" type="submit">{t("Reset password")}</button></form>}
    {stage === "complete" && <div className="recovery-complete"><span><Icon name="shield" size={22} /></span><h2>{type === "password" ? t("Password reset") : t("Your UAN has been sent")}</h2><p>{type === "password" ? t("Your password has been updated. You can now sign in.") : isMember ? t("Your UAN was sent to your registered mobile number.") : t("Your login ID was sent to your registered mobile number.")}</p><button className="primary-button login-submit" type="button" onClick={onBack}>{t("Return to sign in")}</button></div>}
    {stage === "loading" && <div className="login-loading" role="status" aria-live="polite"><span /><strong>{t("Checking your details")}</strong><small>{t("This is a secure mock recovery flow.")}</small></div>}
    <p className="login-note">{t("Prototype only. Do not enter real credentials.")}</p>
  </section></main>;
}
