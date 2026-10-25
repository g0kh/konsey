"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ImagingSectionName, ImagingSectionValue } from "@/lib/imaging-data";
import {
  PACS_LINK_HINT,
  emptyImagingEntry,
  hasImagingContent,
} from "@/lib/imaging-data";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "react-hook-form";
import type { PresentationFormValues } from "@/lib/validations/presentation-form";

type ImagingSectionCardProps = {
  name: ImagingSectionName;
  label: string;
  addLabel: string;
  dateLabel: string;
  pacsEnabled: boolean;
  pacsDisabledNote?: string;
  value: ImagingSectionValue;
  errors?: FieldErrors<PresentationFormValues>[ImagingSectionName];
  onChange: (value: ImagingSectionValue) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-urgent">{message}</p>;
}

export function ImagingSectionCard({
  label,
  addLabel,
  dateLabel,
  pacsEnabled,
  pacsDisabledNote,
  value,
  errors,
  onChange,
}: ImagingSectionCardProps) {
  function updateEntry(
    index: number,
    patch: Partial<ImagingSectionValue["entries"][number]>,
  ) {
    const entries = value.entries.map((entry, i) =>
      i === index ? { ...entry, ...patch } : entry,
    );
    const nextValue = { ...value, entries };
    if (hasImagingContent(entries)) {
      nextValue.enabled = true;
    }
    onChange(nextValue);
  }

  function addEntry() {
    onChange({
      ...value,
      enabled: true,
      entries: [...value.entries, emptyImagingEntry()],
    });
  }

  function removeEntry(index: number) {
    if (value.entries.length <= 1) {
      return;
    }
    const entries = value.entries.filter((_, i) => i !== index);
    onChange({
      ...value,
      enabled: hasImagingContent(entries),
      entries,
    });
  }

  const isOpen = value.enabled || hasImagingContent(value.entries);

  return (
    <div className="form-panel shadow-sm">
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          checked={isOpen}
          onCheckedChange={(checked) =>
            onChange({ ...value, enabled: checked === true })
          }
        />
        <span className="imaging-section-title">{label}</span>
      </label>

      {isOpen && (
        <div className="mt-5 space-y-5 border-t border-theme-border pt-5">
          {value.entries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "space-y-4 rounded-lg border border-border bg-elevated/40 p-4",
                index > 0 && "mt-2",
              )}
            >
              {value.entries.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-muted">
                    Kayıt {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(index)}
                  >
                    Kaldır
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{dateLabel}</Label>
                  <Input
                    className="h-11 w-full text-base text-text-primary"
                    placeholder="12.01.2026 veya 12/06/26"
                    value={entry.date}
                    onChange={(e) => updateEntry(index, { date: e.target.value })}
                  />
                  <FieldError message={errors?.entries?.[index]?.date?.message} />
                </div>

                <div className="space-y-2">
                  <Label>PACS Linki</Label>
                  {pacsEnabled ? (
                    <>
                      <Input
                        className="h-11 w-full text-base text-text-primary"
                        placeholder="https://..."
                        value={entry.link}
                        onChange={(e) => updateEntry(index, { link: e.target.value })}
                      />
                      <p className="text-sm text-text-secondary">{PACS_LINK_HINT}</p>
                      <FieldError message={errors?.entries?.[index]?.link?.message} />
                    </>
                  ) : (
                    <>
                      <Input
                        className="h-11 w-full text-base text-text-muted"
                        placeholder="Henüz kullanılmıyor"
                        value=""
                        disabled
                      />
                      {pacsDisabledNote && (
                        <p className="text-sm text-text-secondary">{pacsDisabledNote}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bulgular / Notlar</Label>
                <Textarea
                  rows={6}
                  className="min-h-[180px] w-full text-base text-text-primary"
                  value={entry.notes}
                  onChange={(e) => updateEntry(index, { notes: e.target.value })}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addEntry}>
            + {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
