"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNCIL_TYPES, BRANCHES } from "@/lib/constants";
import { IMAGING_FORM_SECTIONS } from "@/lib/imaging-data";
import { useCurrentUser } from "@/lib/UserContext";
import { ImagingSectionCard } from "@/components/presentation-form/imaging-section-card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  defaultPresentationFormValues,
  formatImagingNote,
  presentationFormSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  type PresentationFormValues,
} from "@/lib/validations/presentation-form";

const STEPS = [
  {
    title: "Hasta Bilgileri",
    shortTitle: "Hasta",
    description: "Temel hasta kimlik bilgileri",
  },
  {
    title: "Konsey ve Sunum",
    shortTitle: "Konsey",
    description: "Konsey türü ve klinik bilgiler",
  },
  {
    title: "Görüntüleme",
    shortTitle: "Görüntü",
    description: "Görüntüleme ve patoloji notları",
  },
  {
    title: "Hızlı Görüş",
    shortTitle: "Görüş",
    description: "İsteğe bağlı branş görüş talebi",
  },
  {
    title: "Özet",
    shortTitle: "Özet",
    description: "Bilgileri kontrol edin ve gönderin",
  },
] as const;

const STEP_SCHEMAS = [step1Schema, step2Schema, step3Schema, step4Schema];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-urgent">{message}</p>;
}

function truncateSummaryText(text: string, maxLines = 5, maxChars = 320): string {
  const lines = text.split("\n");
  let result = lines.slice(0, maxLines).join("\n");
  if (lines.length > maxLines) {
    result = `${result}…`;
  }
  if (result.length > maxChars) {
    result = `${result.slice(0, maxChars).trimEnd()}…`;
  }
  return result;
}

function SummaryRow({
  label,
  value,
  clamp = false,
}: {
  label: string;
  value?: string | null;
  clamp?: boolean;
}) {
  if (!value) {
    return null;
  }

  const displayValue = clamp ? truncateSummaryText(value) : value;

  return (
    <div className="grid gap-1 border-b border-theme-border py-3 last:border-0 sm:grid-cols-3">
      <dt className="label-meta">{label}</dt>
      <dd
        className={cn(
          "text-sm text-text-primary sm:col-span-2",
          clamp ? "summary-clamp" : "whitespace-pre-wrap",
        )}
      >
        {displayValue}
      </dd>
    </div>
  );
}

export function PresentationForm() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PresentationFormValues>({
    defaultValues: defaultPresentationFormValues,
    mode: "onTouched",
  });

  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const tcNoRegister = register("tcNo");
  const quickConsultEnabled = watch("quickConsultEnabled");
  const allowedCouncilTypes = useMemo(() => {
    if (!user) {
      return [];
    }
    if (user.role === "ADMIN") {
      return [...COUNCIL_TYPES];
    }
    return COUNCIL_TYPES.filter((type) =>
      user.preferredCouncilTypes.includes(type),
    );
  }, [user]);

  useEffect(() => {
    if (allowedCouncilTypes.length === 0) {
      return;
    }
    const current = getValues("councilType");
    if (!allowedCouncilTypes.includes(current)) {
      setValue("councilType", allowedCouncilTypes[0]);
    }
  }, [allowedCouncilTypes, getValues, setValue]);
  const progressPercent =
    STEPS.length <= 1 ? 100 : Math.round((step / (STEPS.length - 1)) * 100);

  function applyZodErrors(
    issues: { path: PropertyKey[]; message: string }[],
  ) {
    clearErrors();
    for (const issue of issues) {
      const field = issue.path.join(".") as Path<PresentationFormValues>;
      if (field) {
        setError(field, { type: "manual", message: issue.message });
      }
    }
  }

  function goNext() {
    const stepSchema = STEP_SCHEMAS[step];
    if (!stepSchema) {
      return;
    }

    const currentValues = getValues();

    if (
      step >= 1 &&
      user &&
      user.role !== "ADMIN" &&
      !user.preferredCouncilTypes.includes(currentValues.councilType)
    ) {
      toast.error("Üye olmadığınız konseye hasta ekleyemezsiniz");
      return;
    }

    if (
      step === 3 &&
      currentValues.quickConsultEnabled &&
      !currentValues.quickConsultQuestion.trim()
    ) {
      setError("quickConsultQuestion", {
        type: "manual",
        message: "Hızlı görüş sorusu zorunludur",
      });
      toast.error("Hızlı görüş sorusu zorunludur");
      return;
    }

    const result = stepSchema.safeParse(currentValues);
    if (!result.success) {
      const issues = result.error.issues;
      applyZodErrors(issues);
      toast.error(issues[0]?.message ?? "Lütfen zorunlu alanları kontrol edin");
      return;
    }

    clearErrors();
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submitPresentation() {
    if (!user) {
      toast.error("Lütfen önce giriş yapın");
      return;
    }

    const currentValues = getValues();
    if (
      user &&
      user.role !== "ADMIN" &&
      !user.preferredCouncilTypes.includes(currentValues.councilType)
    ) {
      toast.error("Üye olmadığınız konseye hasta ekleyemezsiniz");
      return;
    }

    const parsed = presentationFormSchema.safeParse(currentValues);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      applyZodErrors(issues);
      toast.error(issues[0]?.message ?? "Lütfen formu kontrol edin");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/presentations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Sunum gönderilemedi");
      }

      const created = (await response.json()) as { presentationId: string };

      if (
        parsed.data.quickConsultEnabled &&
        parsed.data.quickConsultQuestion.trim()
      ) {
        const consultResponse = await fetch("/api/quick-consults", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presentationId: created.presentationId,
            targetBranch: parsed.data.quickConsultBranch,
            question: parsed.data.quickConsultQuestion.trim(),
          }),
        });

        if (!consultResponse.ok) {
          const payload = (await consultResponse.json()) as { error?: string };
          toast.error(
            payload.error ??
              "Hasta eklendi ancak hızlı görüş talebi gönderilemedi",
          );
          router.push("/konsey");
          router.refresh();
          return;
        }
      }

      toast.success(
        parsed.data.quickConsultEnabled
          ? "Hasta eklendi ve hızlı görüş talebi iletildi"
          : "Hasta başarıyla konseye eklendi",
      );
      router.push("/konsey");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bir hata oluştu",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-5">
        <div className="form-step-progress">
          <div className="form-step-progress-header">
            <div>
              <p className="form-step-progress-eyebrow">
                Adım {step + 1} / {STEPS.length}
              </p>
              <p className="form-step-progress-title">{STEPS[step].title}</p>
            </div>
            <span className="form-step-progress-percent" aria-hidden="true">
              %{progressPercent}
            </span>
          </div>

          <div className="form-step-progress-bar-wrap">
            <div className="form-step-progress-track" aria-hidden="true">
              <div
                className="form-step-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="form-step-progress-nodes"
              role="list"
              aria-label="Form adımları"
            >
              {STEPS.map((item, index) => {
                const isComplete = index < step;
                const isActive = index === step;

                return (
                  <div
                    key={item.title}
                    className="form-step-node"
                    role="listitem"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div
                      className={cn(
                        "form-step-circle",
                        isComplete && "form-step-circle-complete",
                        isActive && "form-step-circle-active",
                      )}
                    >
                      {isComplete ? (
                        <Check className="size-4" strokeWidth={3} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "form-step-label",
                        isComplete && "form-step-label-complete",
                        isActive && "form-step-label-active",
                      )}
                    >
                      {item.shortTitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="form-step-progress-desc">{STEPS[step].description}</p>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step === STEPS.length - 1) {
            void submitPresentation();
          }
        }}
        className="card p-6"
      >
        {step === 0 && (
          <div className="space-y-4">
            <p className="section-divider-label">Hasta Bilgileri</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                />
                <FieldError message={errors.lastName?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tcNo">TC Kimlik No *</Label>
              <Input
                id="tcNo"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                placeholder="11 haneli TC kimlik numarası"
                name={tcNoRegister.name}
                ref={tcNoRegister.ref}
                onBlur={tcNoRegister.onBlur}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
                  setValue("tcNo", digits, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <FieldError message={errors.tcNo?.message} />
            </div>

            <div className="space-y-2 sm:max-w-[200px]">
              <Label htmlFor="age">Yaş</Label>
              <Input
                id="age"
                inputMode="numeric"
                maxLength={3}
                placeholder="Örn. 58"
                {...register("age")}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                  setValue("age", digits, { shouldDirty: true });
                }}
              />
              <FieldError message={errors.age?.message} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="section-divider-label">Konsey ve Sunum</p>
            <div className="space-y-2 sm:max-w-md">
              <Label htmlFor="councilType">Konsey Türü *</Label>
              {isUserLoading ? (
                <p className="text-sm text-text-secondary">Yükleniyor...</p>
              ) : allowedCouncilTypes.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Henüz bir konseye üye değilsiniz. Kullanıcı panelinden konsey
                  ekleyebilirsiniz.
                </p>
              ) : (
                <select
                  id="councilType"
                  className="select-field"
                  {...register("councilType")}
                >
                  {allowedCouncilTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
              <FieldError message={errors.councilType?.message} />
            </div>

            <div className="space-y-2">
              <Label>Konseye Yönlendiren Doktor</Label>
              <div className="flex items-center gap-2 rounded-lg border border-theme-border bg-elevated/50 px-3 py-2.5">
                <span className="text-sm font-medium text-text-primary">
                  {user?.name ?? "—"}
                </span>
                {user?.branch && (
                  <span className="badge badge-branch !py-0.5 !text-[10px]">
                    {user.branch}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentationReason">Konseye Sunulma Sebebi *</Label>
              <Textarea
                id="presentationReason"
                rows={3}
                placeholder="Konseye sunulma sebebini yazın..."
                {...register("presentationReason")}
              />
              <FieldError message={errors.presentationReason?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalSummary">Klinik Özet</Label>
              <Textarea
                id="clinicalSummary"
                rows={4}
                {...register("clinicalSummary")}
              />
            </div>

          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="section-divider-label">Görüntüleme ve Patoloji</p>
            <div className="space-y-5">
              {IMAGING_FORM_SECTIONS.map((section) => (
                <Controller
                  key={section.name}
                  name={section.name}
                  control={control}
                  render={({ field }) => (
                    <ImagingSectionCard
                      name={section.name}
                      label={section.label}
                      addLabel={section.addLabel}
                      dateLabel={section.dateLabel}
                      pacsEnabled={section.pacsEnabled}
                      pacsDisabledNote={section.pacsDisabledNote}
                      value={field.value}
                      onChange={field.onChange}
                      errors={errors[section.name]}
                    />
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="section-divider-label">Hızlı Görüş Paneli</p>
            <p className="form-panel-desc">
              Konsey öncesinde bir branştan hızlı görüş isteyebilirsiniz. Bu adım
              isteğe bağlıdır. Talep, bu konseye katılan ve seçilen branştaki
              hekimlere bildirim olarak gider.
            </p>

            <label className="form-panel flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={quickConsultEnabled}
                onCheckedChange={(checked) =>
                  setValue("quickConsultEnabled", checked === true)
                }
              />
              <span className="form-panel-title">
                Hızlı görüş talebi göndermek istiyorum
              </span>
            </label>

            {quickConsultEnabled && (
              <div className="form-panel-muted space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quickConsultBranch">Hedef Branş</Label>
                  <select
                    id="quickConsultBranch"
                    className="select-field h-11 w-full text-base text-text-primary"
                    {...register("quickConsultBranch")}
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quickConsultQuestion">Soru / Not *</Label>
                  <Textarea
                    id="quickConsultQuestion"
                    rows={5}
                    className="min-h-[140px] w-full text-base text-text-primary"
                    placeholder="Branşa yönelteceğiniz soruyu yazın..."
                    {...register("quickConsultQuestion")}
                  />
                  <FieldError message={errors.quickConsultQuestion?.message} />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="card bg-elevated/50 p-4">
            <h3 className="section-header">Sunum Özeti</h3>
            <dl>
              <SummaryRow
                label="Hasta"
                value={`${getValues("firstName")} ${getValues("lastName")}`}
              />
              <SummaryRow label="TC Kimlik No" value={getValues("tcNo")} />
              <SummaryRow
                label="Yaş"
                value={getValues("age") ? `${getValues("age")}` : undefined}
              />
              <SummaryRow label="Konsey Türü" value={getValues("councilType")} />
              <SummaryRow
                label="Yönlendiren Doktor"
                value={
                  user ? `${user.name} (${user.branch})` : undefined
                }
              />
              <SummaryRow
                label="Sunulma Sebebi"
                value={getValues("presentationReason")}
              />
              <SummaryRow label="Klinik Özet" value={getValues("clinicalSummary")} />
              {IMAGING_FORM_SECTIONS.map((section) => (
                <SummaryRow
                  key={section.name}
                  label={section.label}
                  value={formatImagingNote(getValues(section.name))}
                  clamp
                />
              ))}
              {getValues("quickConsultEnabled") && (
                <SummaryRow
                  label="Hızlı Görüş"
                  value={`${getValues("quickConsultBranch")}\n${getValues("quickConsultQuestion")}`}
                />
              )}
            </dl>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-theme-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
          >
            Geri
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
            >
              İleri
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitPresentation()}
            >
              {isSubmitting ? "Gönderiliyor..." : "Konseye Gönder"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
