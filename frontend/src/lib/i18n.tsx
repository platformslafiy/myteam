import * as React from "react";
import type { Priority, Status } from "@/types";

export type Lang = "tr" | "en";

type Dict = Record<string, string>;

// Flat key dictionaries. Use {var} placeholders for interpolation.
const TR: Dict = {
  "app.subtitle": "{members} üye · {items} iş",
  "header.newItem": "Yeni İş Ekle",
  "header.newMember": "Yeni Üye Ekle",
  "header.refresh": "Yenile",
  "header.theme": "Tema değiştir",
  "header.lang": "Dil",

  "kpi.active": "Aktif iş",
  "kpi.planned": "Planlanan",
  "kpi.overdue": "Geciken",
  "kpi.blocked": "Bloke",
  "kpi.week": "Bu hafta başlayan",
  "kpi.month": "Bu ay biten",
  "kpi.busiest": "En yoğun ekip üyeleri",
  "kpi.noActive": "Aktif atama yok.",

  "filters.title": "Filtreler",
  "filters.project": "Proje",
  "filters.projectPh": "Başlık ara…",
  "filters.member": "Ekip üyesi",
  "filters.allMembers": "Tüm üyeler",
  "filters.all": "Tümü",
  "filters.status": "Durum",
  "filters.allStatuses": "Tüm durumlar",
  "filters.priority": "Öncelik",
  "filters.allPriorities": "Tüm öncelikler",
  "filters.jira": "JIRA kodu",
  "filters.jiraPh": "örn. DEMO",
  "filters.startAfter": "Başlangıç sonrası",
  "filters.endBefore": "Bitiş öncesi",
  "filters.clear": "Temizle ({count})",

  "toolbar.today": "Bugün",
  "zoom.day": "Gün",
  "zoom.week": "Hafta",
  "zoom.month": "Ay",
  "zoom.year": "Yıl",
  "timeline.member": "Ekip Üyesi",
  "timeline.unassigned": "Atanmamış",
  "timeline.noOwner": "Sahibi yok",

  "empty.title": "Filtrelerinize uygun iş bulunamadı",
  "empty.desc": "Filtreleri temizleyin ya da zaman çizelgesine başlamak için yeni bir iş oluşturun.",
  "empty.cta": "Yeni iş",

  "common.cancel": "Vazgeç",
  "common.save": "Kaydet",
  "common.create": "Oluştur",
  "common.close": "Kapat",
  "common.edit": "Düzenle",
  "common.delete": "Sil",
  "common.saving": "Kaydediliyor…",
  "common.deleting": "Siliniyor…",
  "common.reset": "Sıfırla",
  "common.add": "Ekle",
  "common.optional": "(opsiyonel)",
  "common.unassigned": "Atanmamış",

  // Work item modal
  "modal.newItem": "Yeni iş",
  "modal.editItem": "İşi düzenle",
  "modal.workItem": "İş",
  "modal.createDesc": "Detayları doldurun ve yeni bir zaman çizelgesi öğesi oluşturun.",
  "modal.editDesc": "Alanları güncelleyin ve değişikliklerinizi kaydedin.",
  "modal.viewDesc": "Özet görünümü — değiştirmek için Düzenle'ye tıklayın.",
  "modal.deleteTitle": "Bu iş silinsin mi?",
  "modal.deleteDesc": "\"{title}\" kalıcı olarak silinecek. Bu işlem geri alınamaz.",

  // Form labels
  "form.title": "Proje / İş adı *",
  "form.titlePh": "örn. Ödeme Altyapısı Migrasyonu",
  "form.summary": "Kısa özet",
  "form.summaryPh": "Tek satırlık özet",
  "form.description": "Detaylı açıklama",
  "form.descriptionPh": "Kapsam, hedefler, kabul kriterleri…",
  "form.owner": "Sorumlu kişi",
  "form.requester": "Talep eden kişi / birim",
  "form.requesterPh": "örn. Ürün Konseyi",
  "form.start": "Başlangıç tarihi *",
  "form.end": "Bitiş tarihi *",
  "form.effort": "Tahmini efor (gün)",
  "form.priority": "Öncelik",
  "form.status": "Durum",
  "form.progress": "İlerleme ({value}%)",
  "form.color": "Bar rengi (opsiyonel — varsayılan durum rengi)",
  "form.jira": "JIRA referansları",
  "form.jiraNone": "Bağlı JIRA kodu yok.",
  "form.jiraCodePh": "KOD-123",
  "form.assignees": "Destek ekip üyeleri",
  "form.addAssignee": "+ Destek üyesi ekle",
  "form.rolePh": "Rol",
  "form.deps": "Bağımlı işler",
  "form.addDep": "+ Bağımlılık ekle",
  "form.note": "Not ekle",
  "form.notePh": "Opsiyonel not / yorum",
  "form.updatedBy": "Son güncelleyen",
  "form.updatedByPh": "Adınız",
  "form.errTitle": "Başlık zorunludur",
  "form.errDate": "Bitiş tarihi başlangıçtan önce olamaz",

  // Summary
  "sum.complete": "% tamamlandı",
  "sum.owner": "Sorumlu",
  "sum.requester": "Talep eden",
  "sum.effort": "Tahmini efor",
  "sum.days": "gün",
  "sum.start": "Başlangıç",
  "sum.end": "Bitiş",
  "sum.support": "Destek ekip",
  "sum.description": "Açıklama",
  "sum.jira": "JIRA referansları",
  "sum.deps": "Bağımlı olduğu işler",
  "sum.notes": "Notlar",
  "sum.createdBy": "Oluşturan: {who} · {date}",
  "sum.updatedBy": "Son güncelleyen: {who} · {date}",
  "sum.unassigned": "Atanmamış",

  // Member modal
  "member.new": "Yeni ekip üyesi",
  "member.desc": "Ekibe yeni bir üye ekleyin.",
  "member.fullName": "Ad soyad *",
  "member.fullNamePh": "örn. Ayşe Yıldız",
  "member.title": "Ünvan",
  "member.titlePh": "örn. Kıdemli Mühendis",
  "member.department": "Departman",
  "member.departmentPh": "örn. Platform",
  "member.email": "E-posta",
  "member.color": "Avatar rengi",
  "member.active": "Aktif",
  "member.errName": "Ad soyad zorunludur",

  // Toasts
  "toast.created": "İş oluşturuldu",
  "toast.saved": "Değişiklikler kaydedildi",
  "toast.deleted": "İş silindi",
  "toast.datesUpdated": "Tarihler güncellendi",
  "toast.saveFail": "Kaydetme başarısız",
  "toast.deleteFail": "Silme başarısız",
  "toast.dateFail": "Tarihler güncellenemedi",
  "toast.loadItemsFail": "İşler yüklenemedi",
  "toast.loadMembersFail": "Ekip üyeleri yüklenemedi",
  "toast.fixFields": "Lütfen işaretli alanları düzeltin",
  "toast.memberCreated": "Ekip üyesi eklendi",
  "toast.memberFail": "Üye eklenemedi",
  "toast.unexpected": "Beklenmeyen hata",

  // Teams & member management
  "header.manage": "Ekip & Üyeler",
  "filters.team": "Takım",
  "filters.allTeams": "Tüm takımlar",
  "timeline.backlog": "Backlog",
  "legend.normal": "Normal",
  "legend.risk": "Riskli / Yaklaşan",
  "legend.completed": "Tamamlandı",
  "legend.cancelled": "İptal",

  "manage.title": "Ekip ve Üye Yönetimi",
  "manage.desc": "Takımları (yönetim / müdürlük) ve ekip üyelerini ekleyin, düzenleyin veya silin.",
  "manage.teams": "Takımlar",
  "manage.members": "Üyeler",
  "manage.addTeam": "Takım ekle",
  "manage.addMember": "Üye ekle",
  "manage.noTeams": "Henüz takım yok.",
  "manage.noMembers": "Henüz üye yok.",
  "manage.noTeam": "Takımsız",

  "team.new": "Yeni takım",
  "team.edit": "Takımı düzenle",
  "team.name": "Takım adı *",
  "team.namePh": "örn. İş Zekası Uygulama Geliştirme",
  "team.desc": "Açıklama",
  "team.descPh": "Kısa açıklama (opsiyonel)",
  "team.color": "Renk",
  "team.errName": "Takım adı zorunludur",
  "team.deleteTitle": "Bu takım silinsin mi?",
  "team.deleteDesc": "\"{name}\" silinecek. Üyeler ve işler takımsız kalır (silinmez).",

  "member.edit": "Üyeyi düzenle",
  "member.team": "Takım",
  "member.noTeam": "Takımsız",
  "member.deleteTitle": "Bu üye silinsin mi?",
  "member.deleteDesc": "\"{name}\" silinecek. Sahip olduğu işler takımın backlog'una düşer (silinmez).",

  "form.collabTeams": "Birlikte çalışılan ekipler",
  "form.addCollabTeam": "+ Ekip ekle",
  "sum.team": "Takım",
  "sum.collabTeams": "Birlikte çalışılan ekipler",

  "plan.open": "Detaylı plan (Gantt)",
  "plan.title": "Detaylı Plan — Alt Görevler",
  "plan.desc": "Bu işi alt görevlere bölün ve süreleri belirleyin. Bar'ı sürükleyerek taşıyın, kenarlarından uzatıp kısaltın. Alt görevlerin en erken başlangıcı ve en geç bitişi ana işin tarihini oluşturur.",
  "plan.add": "Alt görev ekle",
  "plan.empty": "Henüz alt görev yok. Planlamaya başlamak için bir alt görev ekleyin.",
  "plan.parentRange": "Ana iş tarihi (alt görevlerden hesaplanır)",
  "plan.newSubtask": "Yeni alt görev",
  "plan.subtaskCount": "Alt görevler ({count})",
  "plan.days": "{days} gün",
  "plan.noSubtasks": "Alt görev yok",
  "plan.detailTitle": "Alt görev detayı",
  "plan.selectHint": "Detayını düzenlemek için bir alt göreve tıklayın.",
  "plan.owner": "Sorumlu",
  "plan.members": "Çalışan ekip üyeleri",
  "plan.teams": "Ekipler",
  "plan.progress": "İlerleme",
  "plan.start": "Başlangıç",
  "plan.end": "Bitiş",
  "plan.addMember": "+ Üye ekle",
  "plan.addTeam": "+ Ekip ekle",
  "plan.fullscreen": "Tam ekran",
  "plan.exitFullscreen": "Tam ekrandan çık",
  "sum.subtaskPeople": "Alt görev katılımcıları",
  "sum.subtaskTeams": "Alt görev ekipleri",
  "toast.subtaskSaved": "Alt görev kaydedildi",
  "toast.subtaskDeleted": "Alt görev silindi",
  "toast.subtaskFail": "Alt görev işlemi başarısız",
  "toast.memberUpdated": "Üye güncellendi",
  "toast.memberDeleted": "Üye silindi",
  "toast.teamCreated": "Takım eklendi",
  "toast.teamUpdated": "Takım güncellendi",
  "toast.teamDeleted": "Takım silindi",
  "toast.teamFail": "Takım işlemi başarısız",

  // status / priority
  "status.Planned": "Planlandı",
  "status.In Progress": "Devam Ediyor",
  "status.Blocked": "Bloke",
  "status.Completed": "Tamamlandı",
  "status.Cancelled": "İptal",
  "priority.Low": "Düşük",
  "priority.Medium": "Orta",
  "priority.High": "Yüksek",
  "priority.Critical": "Kritik",
  "overdue": "Gecikmiş",
};

const EN: Dict = {
  "app.subtitle": "{members} members · {items} work items",
  "header.newItem": "New work item",
  "header.newMember": "New team member",
  "header.refresh": "Refresh",
  "header.theme": "Toggle theme",
  "header.lang": "Language",

  "kpi.active": "Active work",
  "kpi.planned": "Planned",
  "kpi.overdue": "Overdue",
  "kpi.blocked": "Blocked",
  "kpi.week": "Starts this week",
  "kpi.month": "Ends this month",
  "kpi.busiest": "Busiest team members",
  "kpi.noActive": "No active assignments.",

  "filters.title": "Filters",
  "filters.project": "Project",
  "filters.projectPh": "Search title…",
  "filters.member": "Team member",
  "filters.allMembers": "All members",
  "filters.all": "All",
  "filters.status": "Status",
  "filters.allStatuses": "All statuses",
  "filters.priority": "Priority",
  "filters.allPriorities": "All priorities",
  "filters.jira": "JIRA code",
  "filters.jiraPh": "e.g. DEMO",
  "filters.startAfter": "Start after",
  "filters.endBefore": "End before",
  "filters.clear": "Clear ({count})",

  "toolbar.today": "Today",
  "zoom.day": "Day",
  "zoom.week": "Week",
  "zoom.month": "Month",
  "zoom.year": "Year",
  "timeline.member": "Team Member",
  "timeline.unassigned": "Unassigned",
  "timeline.noOwner": "No owner",

  "empty.title": "No work items match your filters",
  "empty.desc": "Try clearing the filters or create a new work item to get started on the timeline.",
  "empty.cta": "New work item",

  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.create": "Create",
  "common.close": "Close",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.saving": "Saving…",
  "common.deleting": "Deleting…",
  "common.reset": "Reset",
  "common.add": "Add",
  "common.optional": "(optional)",
  "common.unassigned": "Unassigned",

  "modal.newItem": "New work item",
  "modal.editItem": "Edit work item",
  "modal.workItem": "Work item",
  "modal.createDesc": "Fill in the details and create a new timeline item.",
  "modal.editDesc": "Update the fields and save your changes.",
  "modal.viewDesc": "Summary view — click Edit to change anything.",
  "modal.deleteTitle": "Delete this work item?",
  "modal.deleteDesc": "\"{title}\" will be permanently removed. This cannot be undone.",

  "form.title": "Project / Work item name *",
  "form.titlePh": "e.g. Payment Gateway Migration",
  "form.summary": "Short summary",
  "form.summaryPh": "One-line summary",
  "form.description": "Detailed description",
  "form.descriptionPh": "Scope, goals, acceptance criteria…",
  "form.owner": "Owner",
  "form.requester": "Requested by / unit",
  "form.requesterPh": "e.g. Product Council",
  "form.start": "Start date *",
  "form.end": "End date *",
  "form.effort": "Estimated effort (days)",
  "form.priority": "Priority",
  "form.status": "Status",
  "form.progress": "Progress ({value}%)",
  "form.color": "Bar color (optional — defaults to status color)",
  "form.jira": "JIRA references",
  "form.jiraNone": "No JIRA codes linked.",
  "form.jiraCodePh": "CODE-123",
  "form.assignees": "Support team members",
  "form.addAssignee": "+ Add support member",
  "form.rolePh": "Role",
  "form.deps": "Depends on",
  "form.addDep": "+ Add dependency",
  "form.note": "Add a note",
  "form.notePh": "Optional note / comment",
  "form.updatedBy": "Updated by",
  "form.updatedByPh": "Your name",
  "form.errTitle": "Title is required",
  "form.errDate": "End date must be on or after start date",

  "sum.complete": "% complete",
  "sum.owner": "Owner",
  "sum.requester": "Requested by",
  "sum.effort": "Estimated effort",
  "sum.days": "days",
  "sum.start": "Start date",
  "sum.end": "End date",
  "sum.support": "Support team",
  "sum.description": "Description",
  "sum.jira": "JIRA references",
  "sum.deps": "Depends on",
  "sum.notes": "Notes",
  "sum.createdBy": "Created by {who} · {date}",
  "sum.updatedBy": "Last updated by {who} · {date}",
  "sum.unassigned": "Unassigned",

  "member.new": "New team member",
  "member.desc": "Add a new member to the team.",
  "member.fullName": "Full name *",
  "member.fullNamePh": "e.g. Jane Doe",
  "member.title": "Title",
  "member.titlePh": "e.g. Senior Engineer",
  "member.department": "Department",
  "member.departmentPh": "e.g. Platform",
  "member.email": "Email",
  "member.color": "Avatar color",
  "member.active": "Active",
  "member.errName": "Full name is required",

  "toast.created": "Work item created",
  "toast.saved": "Changes saved",
  "toast.deleted": "Work item deleted",
  "toast.datesUpdated": "Dates updated",
  "toast.saveFail": "Save failed",
  "toast.deleteFail": "Delete failed",
  "toast.dateFail": "Could not update dates",
  "toast.loadItemsFail": "Could not load work items",
  "toast.loadMembersFail": "Could not load team members",
  "toast.fixFields": "Please fix the highlighted fields",
  "toast.memberCreated": "Team member added",
  "toast.memberFail": "Could not add member",
  "toast.unexpected": "Unexpected error",

  // Teams & member management
  "header.manage": "Teams & Members",
  "filters.team": "Team",
  "filters.allTeams": "All teams",
  "timeline.backlog": "Backlog",
  "legend.normal": "Normal",
  "legend.risk": "At risk / Due soon",
  "legend.completed": "Completed",
  "legend.cancelled": "Cancelled",

  "manage.title": "Teams & Members",
  "manage.desc": "Add, edit or remove teams (management / directorate) and team members.",
  "manage.teams": "Teams",
  "manage.members": "Members",
  "manage.addTeam": "Add team",
  "manage.addMember": "Add member",
  "manage.noTeams": "No teams yet.",
  "manage.noMembers": "No members yet.",
  "manage.noTeam": "No team",

  "team.new": "New team",
  "team.edit": "Edit team",
  "team.name": "Team name *",
  "team.namePh": "e.g. BI Application Development",
  "team.desc": "Description",
  "team.descPh": "Short description (optional)",
  "team.color": "Color",
  "team.errName": "Team name is required",
  "team.deleteTitle": "Delete this team?",
  "team.deleteDesc": "\"{name}\" will be removed. Members and work items become team-less (not deleted).",

  "member.edit": "Edit member",
  "member.team": "Team",
  "member.noTeam": "No team",
  "member.deleteTitle": "Delete this member?",
  "member.deleteDesc": "\"{name}\" will be removed. Their work items fall into the team backlog (not deleted).",

  "form.collabTeams": "Collaborating teams",
  "form.addCollabTeam": "+ Add team",
  "sum.team": "Team",
  "sum.collabTeams": "Collaborating teams",

  "plan.open": "Detailed plan (Gantt)",
  "plan.title": "Detailed Plan — Sub-tasks",
  "plan.desc": "Break this work item into sub-tasks and set their durations. Drag a bar to move it, drag its edges to resize. The earliest start and latest end of the sub-tasks define the main task's dates.",
  "plan.add": "Add sub-task",
  "plan.empty": "No sub-tasks yet. Add one to start planning.",
  "plan.parentRange": "Main task dates (derived from sub-tasks)",
  "plan.newSubtask": "New sub-task",
  "plan.subtaskCount": "Sub-tasks ({count})",
  "plan.days": "{days} d",
  "plan.noSubtasks": "No sub-tasks",
  "plan.detailTitle": "Sub-task detail",
  "plan.selectHint": "Click a sub-task to edit its details.",
  "plan.owner": "Owner",
  "plan.members": "Working members",
  "plan.teams": "Teams",
  "plan.progress": "Progress",
  "plan.start": "Start",
  "plan.end": "End",
  "plan.addMember": "+ Add member",
  "plan.addTeam": "+ Add team",
  "plan.fullscreen": "Fullscreen",
  "plan.exitFullscreen": "Exit fullscreen",
  "sum.subtaskPeople": "Sub-task contributors",
  "sum.subtaskTeams": "Sub-task teams",
  "toast.subtaskSaved": "Sub-task saved",
  "toast.subtaskDeleted": "Sub-task deleted",
  "toast.subtaskFail": "Sub-task operation failed",
  "toast.memberUpdated": "Member updated",
  "toast.memberDeleted": "Member deleted",
  "toast.teamCreated": "Team added",
  "toast.teamUpdated": "Team updated",
  "toast.teamDeleted": "Team deleted",
  "toast.teamFail": "Team operation failed",

  "status.Planned": "Planned",
  "status.In Progress": "In Progress",
  "status.Blocked": "Blocked",
  "status.Completed": "Completed",
  "status.Cancelled": "Cancelled",
  "priority.Low": "Low",
  "priority.Medium": "Medium",
  "priority.High": "High",
  "priority.Critical": "Critical",
  "overdue": "Overdue",
};

const DICTS: Record<Lang, Dict> = { tr: TR, en: EN };
const STORAGE_KEY = "ttp-lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  ts: (status: Status) => string;
  tp: (priority: Priority) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "tr"; // default Turkish
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(getInitialLang);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = React.useMemo<I18nContextValue>(() => {
    const dict = DICTS[lang];
    const t = (key: string, vars?: Record<string, string | number>) => {
      let s = dict[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return s;
    };
    return {
      lang,
      setLang,
      t,
      ts: (status: Status) => t(`status.${status}`),
      tp: (priority: Priority) => t(`priority.${priority}`),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
