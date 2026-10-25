"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BRANCHES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date-utils";
import type { CurrentUser } from "@/lib/UserContext";
import type { PresentationDetail } from "@/lib/types/presentation-detail";
import { cn } from "@/lib/utils";

type PresentationInteractionsPanelProps = {
  presentation: PresentationDetail;
  user: CurrentUser | null;
  councilDecision: string;
  onCouncilDecisionChange: (value: string) => void;
  onRefresh: () => void;
};

export function PresentationInteractionsPanel({
  presentation,
  user,
  councilDecision,
  onCouncilDecisionChange,
  onRefresh,
}: PresentationInteractionsPanelProps) {
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [consultBranch, setConsultBranch] = useState<string>(BRANCHES[0]);
  const [consultQuestion, setConsultQuestion] = useState("");
  const [consultSubmitting, setConsultSubmitting] = useState(false);

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const [consultResponses, setConsultResponses] = useState<
    Record<string, string>
  >({});
  const [respondingConsultId, setRespondingConsultId] = useState<string | null>(
    null,
  );

  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [extraOpinion, setExtraOpinion] = useState("");
  const [extraOpinionSubmitting, setExtraOpinionSubmitting] = useState(false);

  const userBranchComment = useMemo(
    () =>
      user
        ? presentation.branchComments.find((c) => c.branch === user.branch)
        : undefined,
    [presentation.branchComments, user],
  );

  const commentsByBranch = useMemo(() => {
    const map = new Map<string, typeof presentation.branchComments>();
    for (const comment of presentation.branchComments) {
      const existing = map.get(comment.branch) ?? [];
      existing.push(comment);
      map.set(comment.branch, existing);
    }
    return map;
  }, [presentation.branchComments]);

  const showDecisionSection =
    user?.role === "ADMIN" || presentation.status === "IN_COUNCIL";

  async function submitConsult() {
    if (!user) {
      toast.error("Giriş yapmanız gerekir");
      return;
    }

    if (!consultQuestion.trim()) {
      toast.error("Soru/not zorunludur");
      return;
    }

    setConsultSubmitting(true);
    try {
      const response = await fetch("/api/quick-consults", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: presentation.id,
          targetBranch: consultBranch,
          question: consultQuestion.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Görüş isteği gönderilemedi");
      }

      toast.success("Hızlı görüş talebi gönderildi");
      setConsultQuestion("");
      setShowConsultForm(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setConsultSubmitting(false);
    }
  }

  async function respondToConsult(consultId: string) {
    if (!user) {
      return;
    }

    const responseText = consultResponses[consultId]?.trim();
    if (!responseText) {
      toast.error("Yanıt zorunludur");
      return;
    }

    setRespondingConsultId(consultId);
    try {
      const response = await fetch(`/api/quick-consults/${consultId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: responseText,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Yanıt gönderilemedi");
      }

      toast.success("Yanıt iletildi");
      setConsultResponses((prev) => {
        const next = { ...prev };
        delete next[consultId];
        return next;
      });
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setRespondingConsultId(null);
    }
  }

  async function submitComment() {
    if (!user) {
      toast.error("Giriş yapmanız gerekir");
      return;
    }

    if (!commentContent.trim()) {
      toast.error("Yorum zorunludur");
      return;
    }

    setCommentSubmitting(true);
    try {
      const response = await fetch("/api/branch-comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: presentation.id,
          content: commentContent.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Yorum eklenemedi");
      }

      toast.success("Başarıyla kaydedildi");
      setCommentContent("");
      setShowCommentForm(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function saveCommentEdit(commentId: string) {
    if (!user || !editCommentContent.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/branch-comments/${commentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editCommentContent.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Yorum güncellenemedi");
      }

      toast.success("Başarıyla güncellendi");
      setEditingCommentId(null);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    }
  }

  async function saveDecision() {
    if (!user) {
      toast.error("Giriş yapmanız gerekir");
      return;
    }

    if (!councilDecision.trim()) {
      toast.error("Konsey kararı zorunludur");
      return;
    }

    setDecisionSubmitting(true);
    try {
      const response = await fetch(`/api/presentations/${presentation.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          councilDecision: councilDecision.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Karar kaydedilemedi");
      }

      toast.success("Konsey kararı kaydedildi");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setDecisionSubmitting(false);
    }
  }

  async function submitExtraOpinion() {
    if (!user) {
      toast.error("Giriş yapmanız gerekir");
      return;
    }

    if (!extraOpinion.trim()) {
      toast.error("Ek görüş zorunludur");
      return;
    }

    setExtraOpinionSubmitting(true);
    try {
      const response = await fetch("/api/supplementary-opinions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentationId: presentation.id,
          content: extraOpinion.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Ek görüş kaydedilemedi");
      }

      toast.success("Ek görüş kaydedildi");
      setExtraOpinion("");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setExtraOpinionSubmitting(false);
    }
  }

  const extraOpinions = presentation.supplementaryOpinions ?? [];

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {presentation.status === "COMPLETED" && (
        <section className="card p-5">
          <h2 className="section-header">Ek Görüş Belirt</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Konsey tamamlandıktan sonra ek görüşünüzü yazabilirsiniz. Kayıt,
            adınız ve branşınızla saklanır.
          </p>

          {extraOpinions.length === 0 ? (
            <p className="mb-4 text-sm text-text-secondary">Henüz ek görüş yok.</p>
          ) : (
            <div className="mb-4 space-y-3">
              {extraOpinions.map((opinion) => (
                <div
                  key={opinion.id}
                  className="rounded-lg border border-theme-border bg-elevated/30 p-4"
                >
                  <p className="text-xs text-text-secondary">
                    {opinion.author.name} · {opinion.branch} ·{" "}
                    {formatDateTime(opinion.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">
                    {opinion.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {user && user.role !== "READONLY" && (
            <div className="space-y-3">
              <Label htmlFor="extra-opinion">Ek görüş</Label>
              <Textarea
                id="extra-opinion"
                value={extraOpinion}
                onChange={(event) => setExtraOpinion(event.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="Tamamlanmış konseye ek görüşünüzü yazın..."
              />
              <Button
                type="button"
                onClick={() => void submitExtraOpinion()}
                disabled={extraOpinionSubmitting}
              >
                {extraOpinionSubmitting ? "Kaydediliyor..." : "Ek Görüşü Kaydet"}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-header !mb-0 !border-0 !pb-0">
            Hızlı Görüş Paneli
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowConsultForm((open) => !open)}
          >
            Hızlı Görüş İste
          </Button>
        </div>

        {showConsultForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-theme-border bg-elevated/50 p-4">
            <div className="space-y-2">
              <Label>Hedef Branş</Label>
              <select
                value={consultBranch}
                onChange={(e) => setConsultBranch(e.target.value)}
                className="select-field"
              >
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Soru / Not</Label>
              <Textarea
                value={consultQuestion}
                onChange={(e) => setConsultQuestion(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={submitConsult}
                disabled={consultSubmitting}
              >
                Gönder
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConsultForm(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        )}

        {presentation.quickConsults.length === 0 ? (
          <p className="text-sm text-text-secondary">Bekleyen hızlı görüş talebi yok</p>
        ) : (
          <div className="space-y-3">
            {presentation.quickConsults.map((consult) => {
              const canRespond =
                user &&
                user.branch === consult.targetBranch &&
                !consult.response;

              return (
                <div
                  key={consult.id}
                  className={cn(
                    "rounded-lg border border-theme-border bg-elevated/30 p-4",
                    consult.response
                      ? "consult-card-answered"
                      : "consult-card-pending",
                  )}
                >
                  <p className="text-xs text-text-secondary">
                    {consult.requestedBy.name} → {consult.targetBranch}
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {consult.question}
                  </p>

                  {consult.followUps.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-accent pl-3">
                      {consult.followUps.map((followUp) => (
                        <div key={followUp.id} className="rounded-md bg-surface/80 p-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                            Ekleme
                          </p>
                          <p className="mt-1 text-sm text-text-primary">
                            {followUp.question}
                          </p>
                          {followUp.response && (
                            <p className="mt-1 text-xs text-text-secondary">
                              Yanıt: {followUp.response}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {consult.response ? (
                    <div className="mt-3 rounded-md bg-surface p-3">
                      <p className="text-sm text-text-secondary">{consult.response}</p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {consult.respondedBy?.name}
                        {consult.respondedAt &&
                          ` · ${formatDateTime(consult.respondedAt)}`}
                      </p>
                    </div>
                  ) : canRespond ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={consultResponses[consult.id] ?? ""}
                        onChange={(e) =>
                          setConsultResponses((prev) => ({
                            ...prev,
                            [consult.id]: e.target.value,
                          }))
                        }
                        placeholder="Buraya yazın..."
                        rows={2}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => respondToConsult(consult.id)}
                        disabled={respondingConsultId === consult.id}
                      >
                        Yanıtla
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-status-pending">Yanıt bekleniyor</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="section-header">Branş Yorumları</h2>

        {user && !userBranchComment && !showCommentForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => setShowCommentForm(true)}
          >
            + Branş Görüşümü Ekle
          </Button>
        )}

        {showCommentForm && user && (
          <div className="mb-4 space-y-3 rounded-lg border border-theme-border bg-elevated/50 p-4">
            <p className="text-xs text-text-secondary">
              {user.name} · {user.branch}
            </p>
            <Textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={4}
              placeholder="Branş görüşünüzü buraya yazın..."
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={submitComment}
                disabled={commentSubmitting}
              >
                Kaydet
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentForm(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        )}

        {presentation.branchComments.length === 0 ? (
          <p className="text-sm text-text-secondary">Henüz yorum eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {Array.from(commentsByBranch.entries()).map(([branch, comments]) => (
              <div key={branch}>
                <h3 className="section-header !mb-2 !text-xs">{branch}</h3>
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-theme-border bg-elevated/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="badge badge-branch">{comment.branch}</span>
                          <p className="mt-1 text-xs text-text-tertiary">
                            {comment.author.name} ·{" "}
                            {formatDateTime(comment.createdAt)}
                          </p>
                        </div>
                        {user?.id === comment.author.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditCommentContent(comment.content);
                            }}
                          >
                            Düzenle
                          </Button>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={editCommentContent}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => saveCommentEdit(comment.id)}
                            >
                              Kaydet
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCommentId(null)}
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showDecisionSection && (
        <section className="card p-5">
          <h2 className="section-header">Konsey Raporu</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="councilDecision">Konsey Sonucu / Rapor</Label>
              <textarea
                id="councilDecision"
                value={councilDecision}
                onChange={(e) => onCouncilDecisionChange(e.target.value)}
                rows={6}
                placeholder="Konsey sonucunu ve raporu yazın..."
                className="decision-textarea"
                disabled={presentation.status === "COMPLETED"}
              />
            </div>
            <div className="space-y-2">
              <Label>Konsey Raporu Yazan</Label>
              <Input
                readOnly
                value={user ? `${user.name} (${user.branch})` : ""}
                className="bg-elevated/50"
              />
            </div>
            {presentation.status !== "COMPLETED" && (
              <Button
                type="button"
                onClick={saveDecision}
                disabled={decisionSubmitting}
                className="w-full"
              >
                {decisionSubmitting
                  ? "Kaydediliyor..."
                  : "Raporu Kaydet ve Konseyi Tamamla"}
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
