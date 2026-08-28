"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../../components/Icon";
import { useLanguage } from "../../language";
import styles from "./claim-flow.module.css";
import { canContinue, claimTypes, hasValidBankDetails, initialClaim, legacyForm, memberDetails, purposeQuestions, purposes, type ClaimDraft, type ClaimType } from "./claim";

const steps = ["Choose claim", "Confirm details", "Claim questions", "Review and submit"];

export function ClaimFlow({ onSubmitted }: { onSubmitted: (claim: ClaimDraft) => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [claim, setClaim] = useState<ClaimDraft>(initialClaim);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), [step]);

  const update = <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => {
    setClaim((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const chooseType = (type: ClaimType) => {
    setClaim({ ...initialClaim, type });
    setOtpSent(false);
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue(step, claim, otpSent)) {
      setError(step === 4 ? t("Verify your bank account through Account Aggregator and enter the 6-digit OTP.") : t("Complete the required fields to continue."));
      return;
    }
    if (step < 4) setStep((current) => current + 1);
    else onSubmitted(claim);
  };

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <p className="eyebrow">{t("CLAIMS")}</p>
        <h1 ref={headingRef} tabIndex={-1}>{t("Submit a claim")}</h1>
        <p>{t("Answer only what is needed. We’ll prepare the right EPFO form for you.")}</p>
      </header>

      <ol className={styles.steps} aria-label={t("Claim progress")}>
        {steps.map((label, index) => {
          const number = index + 1;
          return <li key={label} className={number <= step ? styles.active : ""} aria-current={number === step ? "step" : undefined}><span>{number < step ? "✓" : number}</span><small>{t(label)}</small></li>;
        })}
      </ol>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {step === 1 && <ChooseClaim value={claim.type} onChange={chooseType} />}
        {step === 2 && <ConfirmDetails claim={claim} onConfirm={(checked) => update("detailsConfirmed", checked)} />}
        {step === 3 && <ClaimQuestions claim={claim} update={update} />}
        {step === 4 && <Review claim={claim} otpSent={otpSent} onSendOtp={() => { setOtpSent(true); setError(""); }} update={update} />}

        <p className={styles.error} role="alert">{error}</p>
        <div className={styles.actions}>
          {step > 1 && <button type="button" className={styles.secondary} onClick={() => { setStep((current) => current - 1); setError(""); }}>{t("Back")}</button>}
          <button type="submit" className={styles.primary}>{step === 4 ? t("Submit claim") : t("Continue")} <Icon name="arrow" size={16} /></button>
        </div>
      </form>
    </div>
  );
}

function ChooseClaim({ value, onChange }: { value: ClaimDraft["type"]; onChange: (type: ClaimType) => void }) {
  const { t } = useLanguage();
  return (
    <fieldset className={styles.fieldset}>
      <legend>{t("What would you like to claim?")}</legend>
      <p>{t("Choose one option. You can review everything before submitting.")}</p>
      <div className={styles.choices}>
        {claimTypes.map((option) => (
          <label key={option.value} className={value === option.value ? styles.selected : ""}>
            <input type="radio" name="claimType" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className={styles.choiceIcon}><Icon name={option.value === "pension" ? "shield" : "claim"} /></span>
            <span><strong>{t(option.label)}</strong><small>{t(option.description)}</small><i>{option.form}</i></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ConfirmDetails({ claim, onConfirm }: { claim: ClaimDraft; onConfirm: (checked: boolean) => void }) {
  const { t } = useLanguage();
  const employment = memberDetails(claim.type);
  const details = [
    ["Name", "Rahul Patil"],
    ["UAN", "1009 2000 0123"],
    ["Employer", employment.employer],
    ["Date of joining", employment.joined],
    ["Date of leaving", t(employment.left)],
    ["Bank account", "HDFC Bank •••• 4821"],
  ];
  return (
    <fieldset className={styles.fieldset}>
      <legend>{t("Confirm your details")}</legend>
      <p>{t("These details come from your UAN and verified KYC records.")}</p>
      <dl className={styles.details}>{details.map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{value}</dd></div>)}</dl>
      <label className={styles.check}><input type="checkbox" checked={claim.detailsConfirmed} onChange={(event) => onConfirm(event.target.checked)} /><span>{t("These details are correct")}</span></label>
    </fieldset>
  );
}

function ClaimQuestions({ claim, update }: { claim: ClaimDraft; update: <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => void }) {
  const { t } = useLanguage();
  return (
    <fieldset className={styles.fieldset}>
      <legend>{t("A few details about your claim")}</legend>
      <p>{t("We only ask questions needed for your selected claim.")}</p>
      {claim.type === "advance" && (
        <div className={styles.fields}>
          <label><span>{t("Purpose of advance")}</span><select value={claim.purpose} onChange={(event) => { update("purpose", event.target.value); update("purposeDetail", ""); }}><option value="">{t("Select a purpose")}</option>{purposes.map((purpose) => <option key={purpose} value={purpose}>{t(purpose)}</option>)}</select></label>
          <label><span>{t("Amount requested")}</span><div className={styles.amount}><b>₹</b><input type="number" min="1" inputMode="numeric" value={claim.amount} onChange={(event) => update("amount", event.target.value)} /></div></label>
          {claim.purpose && <label className={styles.full}><span>{t(purposeQuestions[claim.purpose])}</span><input value={claim.purposeDetail} onChange={(event) => update("purposeDetail", event.target.value)} /></label>}
        </div>
      )}
      {claim.type === "settlement" && (
        <div className={styles.fields}><label className={styles.full}><span>{t("Tax declaration")}</span><select value={claim.taxDeclaration} onChange={(event) => update("taxDeclaration", event.target.value)}><option value="">{t("Select one")}</option><option value="Not applicable">{t("Not applicable")}</option><option value="Form 15G">Form 15G</option><option value="Form 15H">Form 15H</option></select><small>{t("Choose Form 15G or 15H only if it applies to your tax situation.")}</small></label></div>
      )}
      {claim.type === "pension" && (
        <div className={styles.inlineChoices}>
          {["Pension claim benefit", "Scheme certificate"].map((choice) => <label key={choice} className={claim.pensionChoice === choice ? styles.selected : ""}><input type="radio" name="pensionChoice" checked={claim.pensionChoice === choice} onChange={() => update("pensionChoice", choice)} /><span><strong>{t(choice)}</strong><small>{t(choice === "Pension claim benefit" ? "Receive the eligible pension claim amount" : "Preserve your pension service for the future")}</small></span></label>)}
        </div>
      )}
    </fieldset>
  );
}

function Review({ claim, otpSent, onSendOtp, update }: { claim: ClaimDraft; otpSent: boolean; onSendOtp: () => void; update: <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => void }) {
  const { t } = useLanguage();
  const type = claimTypes.find((option) => option.value === claim.type)!;
  const answer = claim.type === "advance" ? `${t(claim.purpose)} · ₹${Number(claim.amount).toLocaleString("en-IN")} · ${claim.purposeDetail}` : claim.type === "settlement" ? t(claim.taxDeclaration) : t(claim.pensionChoice);
  return (
    <fieldset className={styles.fieldset}>
      <legend>{t("Review and submit")}</legend>
      <p>{t("We generated the required legacy form data from your answers.")}</p>
      <div className={styles.summary}>
        <div><span>{t("Claim type")}</span><strong>{t(type.label)}</strong></div>
        <div><span>{t("EPFO form")}</span><strong>{legacyForm(claim.type)}</strong></div>
        <div className={styles.full}><span>{t("Claim details")}</span><strong>{answer}</strong></div>
        <div className={styles.full}><span>{t("Payment account")}</span><strong>{claim.bankVerified ? `HDFC Bank •••• ${claim.bankAccount.slice(-4)}` : t("Verification required")}</strong></div>
      </div>
      <BankVerification claim={claim} update={update} />
      <div className={styles.otp}>
        <div><strong>{t("Aadhaar verification")}</strong><small>{t("An OTP will be sent to your Aadhaar-linked mobile number ending 8842.")}</small></div>
        {!otpSent ? <button type="button" className={styles.secondary} onClick={onSendOtp}>{t("Send OTP")}</button> : <label><span>{t("6-digit OTP")}</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={claim.otp} onChange={(event) => update("otp", event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>}
      </div>
    </fieldset>
  );
}

function BankVerification({ claim, update }: { claim: ClaimDraft; update: <K extends keyof ClaimDraft>(key: K, value: ClaimDraft[K]) => void }) {
  const { t, tpl } = useLanguage();
  const [stage, setStage] = useState<"details" | "consent" | "connecting" | "verified">(claim.bankVerified ? "verified" : "details");
  const [consented, setConsented] = useState(false);
  const [provider, setProvider] = useState("Finvu");
  const [error, setError] = useState("");
  const updateBank = (key: "bankAccount" | "ifsc", value: string) => {
    update(key, key === "ifsc" ? value.toUpperCase() : value.replace(/\D/g, ""));
    update("bankVerified", false);
    setStage("details");
    setError("");
  };
  const beginConsent = () => {
    if (!hasValidBankDetails(claim)) return setError(t("Enter a valid bank account number and IFSC code."));
    setStage("consent");
  };
  const verify = () => {
    setStage("connecting");
    window.setTimeout(() => {
      update("bankVerified", true);
      setStage("verified");
    }, 900);
  };

  if (stage === "connecting") return <section className={styles.bankVerification} aria-live="polite"><div className={styles.bankLoading}><span /><strong>{t("Verifying account through Account Aggregator")}</strong><small>{t("Your bank is responding to your one-time consent request.")}</small></div></section>;
  if (stage === "verified") return <section className={styles.bankVerification}><div className={styles.bankVerified}><span><Icon name="shield" size={19} /></span><div><strong>{t("Bank account verified")}</strong><small>{tpl("HDFC Bank account ending {lastFour} is verified for this claim.", { lastFour: claim.bankAccount.slice(-4) })}</small></div><button type="button" className={styles.secondary} onClick={() => { update("bankVerified", false); setStage("details"); }}>{t("Change")}</button></div></section>;
  if (stage === "consent") return <section className={styles.bankVerification} aria-labelledby="aa-consent-title"><div className={styles.bankTitle}><span><Icon name="shield" size={18} /></span><div><strong id="aa-consent-title">{t("Review consent")}</strong><small>{t("Account Aggregator shares data only after your approval.")}</small></div></div><div className={styles.bankFields}><label><span>Consent manager</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option>Finvu</option><option>OneMoney</option><option>CAMSfinserv</option></select></label></div><dl className={styles.consentDetails}><div><dt>Provider</dt><dd>{provider} · simulated AA consent</dd></div><div><dt>{t("Recipient")}</dt><dd>{t("EPFO claim payment verification (prototype)")}</dd></div><div><dt>{t("Purpose")}</dt><dd>{t("Verify your payment account for this claim")}</dd></div><div><dt>{t("Data requested")}</dt><dd>{t("Account holder name, account number, IFSC and account status")}</dd></div><div><dt>{t("Duration")}</dt><dd>{t("One time")}</dd></div></dl><label className={styles.check}><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} /><span>{t("I consent to share these bank details for this claim only.")}</span></label><div className={styles.bankActions}><button type="button" className={styles.secondary} onClick={() => setStage("details")}>{t("Back")}</button><button type="button" className={styles.primary} disabled={!consented} onClick={verify}>Continue with {provider}</button></div></section>;
  return <section className={styles.bankVerification} aria-labelledby="bank-verification-title"><div className={styles.bankTitle}><span><Icon name="building" size={18} /></span><div><strong id="bank-verification-title">{t("Verify payment account")}</strong><small>{t("Re-enter your bank account details to verify them for this claim.")}</small></div></div><div className={styles.bankFields}><label><span>{t("Bank account number")}</span><input inputMode="numeric" autoComplete="off" value={claim.bankAccount} onChange={(event) => updateBank("bankAccount", event.target.value)} /></label><label><span>{t("IFSC code")}</span><input autoCapitalize="characters" autoComplete="off" value={claim.ifsc} onChange={(event) => updateBank("ifsc", event.target.value)} /></label></div><p className={styles.bankNote}><Icon name="shield" size={15} />{t("This prototype uses a one-time Account Aggregator consent flow. It does not connect to a bank or EPFO.")}</p>{error && <p className={styles.bankError} role="alert">{error}</p>}<button type="button" className={styles.secondary} onClick={beginConsent}>{t("Verify through Account Aggregator")}</button></section>;
}
