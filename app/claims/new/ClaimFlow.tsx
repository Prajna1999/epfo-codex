"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../../components/Icon";
import { useLanguage } from "../../language";
import styles from "./claim-flow.module.css";
import { canContinue, claimTypes, initialClaim, legacyForm, memberDetails, purposeQuestions, purposes, type ClaimDraft, type ClaimType } from "./claim";

const steps = ["Choose claim", "Confirm details", "Claim questions", "Review and submit"];

export function ClaimFlow() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [claim, setClaim] = useState<ClaimDraft>(initialClaim);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), [step, submitted]);

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
      setError(step === 4 ? t("Confirm your bank account and enter the 6-digit OTP.") : t("Complete the required fields to continue."));
      return;
    }
    if (step < 4) setStep((current) => current + 1);
    else setSubmitted(true);
  };

  if (submitted) return <Success claim={claim} headingRef={headingRef} />;

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}><Icon name="arrow" size={16} /> {t("Back to dashboard")}</Link>
      <header className={styles.heading}>
        <p className="eyebrow">{t("WITHDRAWAL")}</p>
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
          {["Withdrawal benefit", "Scheme certificate"].map((choice) => <label key={choice} className={claim.pensionChoice === choice ? styles.selected : ""}><input type="radio" name="pensionChoice" checked={claim.pensionChoice === choice} onChange={() => update("pensionChoice", choice)} /><span><strong>{t(choice)}</strong><small>{t(choice === "Withdrawal benefit" ? "Receive the eligible pension withdrawal amount" : "Preserve your pension service for the future")}</small></span></label>)}
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
        <div className={styles.full}><span>{t("Payment account")}</span><strong>HDFC Bank •••• 4821</strong></div>
      </div>
      <label className={styles.check}><input type="checkbox" checked={claim.bankConfirmed} onChange={(event) => update("bankConfirmed", event.target.checked)} /><span>{t("I confirm this bank account for payment")}</span></label>
      <div className={styles.otp}>
        <div><strong>{t("Aadhaar verification")}</strong><small>{t("An OTP will be sent to your Aadhaar-linked mobile number ending 8842.")}</small></div>
        {!otpSent ? <button type="button" className={styles.secondary} onClick={onSendOtp}>{t("Send OTP")}</button> : <label><span>{t("6-digit OTP")}</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={claim.otp} onChange={(event) => update("otp", event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>}
      </div>
    </fieldset>
  );
}

function Success({ claim, headingRef }: { claim: ClaimDraft; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const { t } = useLanguage();
  return (
    <section className={styles.success}>
      <span><Icon name="shield" size={30} /></span>
      <p className="eyebrow">{t("CLAIM SUBMITTED")}</p>
      <h1 ref={headingRef} tabIndex={-1}>{t("Your claim has been submitted")}</h1>
      <p>{t("EPFO will review your claim. You can track its progress from Past Claim Status.")}</p>
      <dl><div><dt>{t("Claim reference")}</dt><dd>CLM-20260824-001</dd></div><div><dt>{t("EPFO form")}</dt><dd>{legacyForm(claim.type)}</dd></div></dl>
      <Link href="/" className={styles.primary}>{t("Back to dashboard")}</Link>
    </section>
  );
}
