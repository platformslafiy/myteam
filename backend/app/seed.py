"""Seed script: minimal team-based dummy dataset.

Run standalone:   python -m app.seed
Or via env flag:  SEED_ON_STARTUP=true

Creates a few teams (management / müdürlük), a SINGLE team member in one of
them, and a handful of dummy work items — including one backlog item (no owner)
and one with a collaborating team — so every concept is visible out of the box.
"""
from __future__ import annotations

from datetime import date, timedelta

from .database import Base, SessionLocal, engine
from . import models

TODAY = date(2026, 6, 7)  # anchor so dummy data stays meaningful relative to "now"

TEAMS = [
    ("İş Zekası Uygulama Geliştirme", "BI uygulama geliştirme ekibi", "#6366f1"),
    ("Veri Mühendisliği", "Veri platformu ve pipeline'lar", "#0ea5e9"),
    ("Raporlama & Analitik", "Raporlama ve analitik yönetimi", "#10b981"),
]

MEMBER = {
    "full_name": "Demo Kullanıcı",
    "title": "Yazılım Mühendisi",
    "department": "Demo Ekip",
    "email": "demo@example.com",
    "avatar_color": "#6366f1",
}

# (title, status, priority, start_offset_days, duration_days, progress, effort)
WORK_ITEMS = [
    ("Demo Proje A", "In Progress", "High", -5, 20, 40, 12),
    ("Demo Proje B", "Planned", "Medium", 3, 18, 0, 8),
    ("Demo Proje C", "Blocked", "Critical", -2, 15, 20, 10),
    ("Demo Proje D", "Completed", "Low", -30, 12, 100, 5),
    ("Demo Proje E", "In Progress", "Medium", -3, 22, 55, 14),  # overlaps A & C
]


def run_seed(reset: bool = True) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(models.TeamMember).count() > 0 and not reset:
            print("DB already populated; skipping (pass reset=True to force).")
            return

        teams = [models.Team(name=n, description=d, color=c) for n, d, c in TEAMS]
        db.add_all(teams)
        db.flush()
        primary_team = teams[0]

        member = models.TeamMember(is_active=True, team_id=primary_team.id, **MEMBER)
        db.add(member)
        db.flush()

        items: list[models.ProjectWorkItem] = []
        for title, status, priority, start_off, dur, progress, effort in WORK_ITEMS:
            start = TODAY + timedelta(days=start_off)
            end = start + timedelta(days=dur)
            item = models.ProjectWorkItem(
                title=title,
                summary=f"{title} — dummy özet.",
                description=f"{title} için dummy detay açıklaması.",
                owner_id=member.id,
                team_id=primary_team.id,
                requester="Demo Birim",
                start_date=start,
                end_date=end,
                estimated_effort_days=float(effort),
                priority=priority,
                status=status,
                progress=progress,
                created_by="seed",
                updated_by="seed",
            )
            db.add(item)
            items.append(item)

        # A backlog item: belongs to the team but has no owner.
        backlog = models.ProjectWorkItem(
            title="Demo Backlog İşi",
            summary="Sahipsiz, ekip backlog'unda bekleyen iş.",
            description="Bu iş bir kişiye atanmamıştır; ekip backlog'unda bekler.",
            owner_id=None,
            team_id=primary_team.id,
            requester="Demo Birim",
            start_date=TODAY + timedelta(days=2),
            end_date=TODAY + timedelta(days=16),
            estimated_effort_days=6.0,
            priority="Medium",
            status="Planned",
            progress=0,
            created_by="seed",
            updated_by="seed",
        )
        db.add(backlog)
        db.flush()

        # JIRA codes + a collaborating team on the first item.
        db.add(models.JiraReference(work_item_id=items[0].id, jira_code="DEMO-1", jira_url="https://jira.example.com/browse/DEMO-1"))
        db.add(models.JiraReference(work_item_id=items[0].id, jira_code="DEMO-2", jira_url="https://jira.example.com/browse/DEMO-2"))
        db.add(models.WorkItemTeam(work_item_id=items[0].id, team_id=teams[1].id))

        db.commit()
        print(
            f"Seed complete: {len(teams)} teams, 1 member, {len(items) + 1} work items "
            "(incl. 1 backlog item)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    run_seed(reset=True)
