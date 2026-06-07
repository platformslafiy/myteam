import * as React from "react";
import { Plus, Pencil, Users2, UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Team, TeamMember } from "@/types";
import { Avatar } from "./Avatar";
import { TeamModal } from "./TeamModal";
import { MemberModal } from "./MemberModal";

interface ManageDialogProps {
  open: boolean;
  teams: Team[];
  members: TeamMember[];
  onClose: () => void;
  onChanged: () => void;
}

export function ManageDialog({ open, teams, members, onClose, onChanged }: ManageDialogProps) {
  const { t } = useI18n();
  const [teamModal, setTeamModal] = React.useState<{ open: boolean; team: Team | null }>({
    open: false,
    team: null,
  });
  const [memberModal, setMemberModal] = React.useState<{ open: boolean; member: TeamMember | null }>({
    open: false,
    member: null,
  });

  const teamName = (id: number | null) =>
    id == null ? t("manage.noTeam") : teams.find((tm) => tm.id === id)?.name ?? t("manage.noTeam");

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <div className="flex max-h-[88vh] flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="pr-8">{t("manage.title")}</DialogTitle>
              <DialogDescription>{t("manage.desc")}</DialogDescription>
            </DialogHeader>

            <div className="tl-scroll grid flex-1 gap-6 overflow-y-auto px-6 py-5 md:grid-cols-2">
              {/* Teams */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    {t("manage.teams")} ({teams.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setTeamModal({ open: true, team: null })}>
                    <Plus className="h-3.5 w-3.5" /> {t("manage.addTeam")}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {teams.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("manage.noTeams")}</p>
                  )}
                  {teams.map((tm) => (
                    <button
                      key={tm.id}
                      onClick={() => setTeamModal({ open: true, team: tm })}
                      className="group flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tm.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{tm.name}</div>
                        {tm.description && (
                          <div className="truncate text-xs text-muted-foreground">{tm.description}</div>
                        )}
                      </div>
                      <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Members */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    {t("manage.members")} ({members.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setMemberModal({ open: true, member: null })}>
                    <Plus className="h-3.5 w-3.5" /> {t("manage.addMember")}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {members.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("manage.noMembers")}</p>
                  )}
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMemberModal({ open: true, member: m })}
                      className="group flex w-full items-center gap-2.5 rounded-lg border bg-background px-3 py-2 text-left hover:bg-accent"
                    >
                      <Avatar name={m.full_name} color={m.avatar_color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{m.full_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[m.title, teamName(m.team_id)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TeamModal
        open={teamModal.open}
        team={teamModal.team}
        onClose={() => setTeamModal({ open: false, team: null })}
        onChanged={onChanged}
      />
      <MemberModal
        open={memberModal.open}
        member={memberModal.member}
        teams={teams}
        onClose={() => setMemberModal({ open: false, member: null })}
        onChanged={onChanged}
      />
    </>
  );
}
