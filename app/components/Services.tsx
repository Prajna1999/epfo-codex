"use client";

import { useState } from "react";
import { useLanguage } from "../language";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { createUpdateRequest, updateServices, type UpdateRequest, type UpdateService } from "./services-data";
import styles from "./services.module.css";

type Navigate = (item: string, tab?: "start" | "status", claimId?: string) => void;

const transferId = "TRF-20230701-001";

export function Services({ onNavigate }: { onNavigate: Navigate }) {
  const { t } = useLanguage();
  const [activeService, setActiveService] = useState<UpdateService | null>(null);
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  return (
    <section className={styles.page} aria-label={t("Services")}>
      <section className={styles.requests} aria-label={t("Updates and requests")}>
        <div><p className="eyebrow">{t("SERVICE REQUESTS")}</p><h2>{t("Updates and requests")}</h2></div>
        {requests.length ? <div className={styles.requestList}>{requests.map((request) => <RequestStatus key={request.id} request={request} />)}</div> : <p>{t("No update requests in progress.")}</p>}
      </section>
      <ServiceGroup title="Keep your account ready">
        {updateServices.slice(0, 2).map((service) => <ServiceCard key={service.id} service={service} onAction={() => setActiveService(service)} />)}
        {updateServices.slice(3).map((service) => <ServiceCard key={service.id} service={service} onAction={() => setActiveService(service)} />)}
      </ServiceGroup>
      <ServiceGroup title="Family and nomination">
        <ServiceCard service={updateServices[2]} onAction={() => setActiveService(updateServices[2])} />
      </ServiceGroup>
      <ServiceGroup title="Changing jobs">
        <StaticServiceCard icon="briefcase" title="Transfer previous PF" detail="Your Techcore PF was transferred to Infosys." status="Transferred" action="Track transfer" onAction={() => onNavigate("Claims", "status", transferId)} />
      </ServiceGroup>
      <ServiceGroup title="Account documents">
        <StaticServiceCard icon="idcard" title="UAN card" detail="View or download your verified UAN identity card." status="Available" action="View UAN card" onAction={() => onNavigate("Home")} />
      </ServiceGroup>
      {activeService && <UpdateRequestFlow service={activeService} onClose={() => setActiveService(null)} onSubmitted={() => { setRequests((current) => [createUpdateRequest(activeService, current.length + 1), ...current]); setActiveService(null); }} />}
      <p className={styles.note}>{t("Service updates are simulated in this prototype.")}</p>
    </section>
  );
}

function ServiceGroup({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLanguage();
  return <section className={styles.group}><h2>{t(title)}</h2><div className={styles.grid}>{children}</div></section>;
}

function ServiceCard({ service, onAction }: { service: UpdateService; onAction: () => void }) {
  return <StaticServiceCard icon={service.icon} title={service.title} detail={service.detail} status={service.currentStatus} action={service.action} onAction={onAction} />;
}

function StaticServiceCard({ icon, title, detail, status, action, onAction }: { icon: IconName; title: string; detail: string; status: string; action: string; onAction: () => void }) {
  const { t } = useLanguage();
  return <article className={styles.card}><div className={styles.icon}><Icon name={icon} size={19} /></div><div><h3>{t(title)}</h3><p>{t(detail)}</p><span className={styles.status}>{t(status)}</span><button type="button" onClick={onAction}>{t(action)} <Icon name="arrow" size={15} /></button></div></article>;
}

function UpdateRequestFlow({ service, onClose, onSubmitted }: { service: UpdateService; onClose: () => void; onSubmitted: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  return <section className={styles.flow} aria-label={t(service.title)}><div className={styles.flowHead}><div><p className="eyebrow">{t("UPDATE REQUEST")}</p><h2>{t(service.title)}</h2><p>{step === 1 ? t("Enter the details for your request.") : t("Review your request before submitting.")}</p></div><button type="button" aria-label={t("Close")} onClick={onClose}>×</button></div>{step === 1 ? <form onSubmit={(event) => { event.preventDefault(); setStep(2); }}><div className={styles.fields}>{service.fields.map((field) => <label key={field.label}>{t(field.label)}<input type={field.type ?? "text"} required /></label>)}</div><button className="primary-button" type="submit">{t("Continue")}</button></form> : <div className={styles.review}><p>{t("Your request will follow this status path:")}</p><ol>{service.steps.map((item) => <li key={item}>{t(item)}</li>)}</ol>{service.reviewSteps && <p className={styles.note}><strong>{t("If Aadhaar verification cannot confirm the change")}: </strong>{service.reviewSteps.map((item) => t(item)).join(" → ")}</p>}<button className="primary-button" type="button" onClick={onSubmitted}>{t("Submit request")}</button></div>}</section>;
}

function RequestStatus({ request }: { request: UpdateRequest }) {
  const { t } = useLanguage();
  return <article className={styles.request}><div><strong>{t(request.title)}</strong><small>{request.id} · {t("Submitted")} {request.submitted}</small></div><span>{t(request.status)}</span><ol>{request.steps.map((step, index) => <li key={step} className={index <= request.currentStep ? styles.complete : ""}>{t(step)}</li>)}</ol></article>;
}
