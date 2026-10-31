# RevisionAI — Project Parking & Reactivation Guide

**Target Audience:** Bharath Nair  
**Created:** November 1, 2026  
**Context:** Offloading RevisionAI (12 GB) to external SSD (WD-SN570-1TB) to free up internal MacBook storage during a 2–4+ week pause.

---

## 1. Executive Summary & Storage Audit

### Current Disk Consumption (Total: ~12.02 GB)

| Folder | Size | What is it? | Keep, Clean, or Move? |
| :--- | :--- | :--- | :--- |
| **`.git`** | **6.8 GB** | Git history + **1.67 GB orphaned pack garbage** (`tmp_pack_ilqDqL`) + 3.3 GB loose PDF/image blobs | **Clean with `git gc`** (reclaims ~4.5–5 GB) |
| **`pipeline/input`** | **2.0 GB** | Raw source PDFs (Marrow, Prepladder, PYQ notes) | **Move to External SSD + Google Drive** |
| **`pipeline/output`** | **776 MB** | Extracted JSON questions and intermediate cropped images | **Move to External SSD** |
| **`backend`** | **883 MB** | **723 MB is question clinical images** in `wwwroot/media`; 103 MB is compiled `bin/obj` | **Clean `bin/obj`**, move media with project |
| **`frontend`** | **335 MB** | `node_modules` (310 MB) + `.angular` build cache | **Delete disposable cache** before parking |
| **Other** | **~200 MB** | `RevisionAIDocPipeline`, local docs, scripts | Keep with project |

---

## 2. Developer FAQ: Why & How

### Q: Why does local Git have 6.8 GB?
1. **The 1.7 GB Zombie Packfile:** On June 4th, an interrupted git repack or fetch left a temporary file `tmp_pack_ilqDqL` in `.git/objects/pack/`. Git does not delete partial packfiles automatically.
2. **3.3 GB of Loose Blobs:** Every time a Python extraction script read a PDF, generated page previews, or staged temporary graphics, Git recorded those binary blobs. Even if later ignored or deleted, Git keeps them in `.git/objects/` for 30–90 days just in case.
3. **Did this happen because you didn't push?** No. Pushing does *not* push unreachable garbage to GitHub. In fact, GitHub blocks files over 100 MB. The garbage is purely local disk clutter.

### Q: What do `git prune` and `git gc` actually do?
* **`git prune`**: Tells Git: *"Find any orphan file in `.git` that isn't connected to a commit or branch, and permanently trash it."*
* **`git gc` (Garbage Collection)**: Tells Git: *"Tidy up the storage room. Delete the 1.7 GB interrupted packfile, pack loose objects into compressed archives, and index everything."*
* **Is it safe?** **100% safe.** It never modifies your current code files, working directory, or committed history. It only purges disconnected ghosts.

### Q: Why is `backend` 883 MB?
* **723 MB** is inside `backend/src/RevisionAI.Api/wwwroot/media/`. These are the hundreds of clinical photos, X-rays, histopathology slides, and anatomical diagrams required for the NEET PG questions.
* **103 MB** is compiled C# binaries (`bin` and `obj` folders).

### Q: Should I park the ENTIRE project or only parts?
**Park the ENTIRE project on the external SSD.**  
*Splitting* (code on Mac, PDFs on SSD) leads to broken paths, lost files, and confusion when returning weeks later. Your WD-SN570 NVMe drive runs at ~900–1000 MB/s over USB-C and is formatted to APFS (Apple's native file system). It can run the full project directly without any speed penalty.

---

## 3. Pre-Flight Checklist (Critical Safeguards)

Before moving or deleting anything from your Mac:
- [ ] **Commit the 8 active modified files** (PYQ mock page, PyqsController, SeedQuestions, etc.).
- [ ] **Push all commits to GitHub** (`origin main`). 6 commits are currently local-only!
- [ ] **Run `git prune` and `git gc`** to shrink `.git` by ~5 GB.
- [ ] **Clean disposable dependencies** (`node_modules`, `bin/obj`).
- [ ] **Rsync project to External SSD** (`/Volumes/WD-SN570-1TB/Projects/RevisionAI`).
- [ ] **Verify files and check git status on SSD**.
- [ ] **Only then delete local copy from Mac**.

---

## 4. Phase 1: Step-by-Step Parking Procedure

Execute these commands in order from Terminal inside `/Users/bharathnair/Projects/RevisionAI`:

### Step 1: Save Pending Work & Push to GitHub Cloud
```bash
cd /Users/bharathnair/Projects/RevisionAI

# 1. Stage and commit remaining PYQ mock and question card updates
git add .
git commit -m "feat(pyqs): save PYQ mock taker and question card progress before parking"

# 2. Push all 7 local commits safely to GitHub
git push origin main
```
> **Checkpoint:** Check `https://github.com/bharath-v-nair/revision-ai`. Your code is now 100% safe in the cloud.

---

### Step 2: Clean the Git Garbage (Recovers ~5 GB)
```bash
# Clean orphaned packfile and loose extraction blobs
git prune
git gc --prune=now
```
> **Checkpoint:** Run `du -sh .git` — it will have dropped from 6.8 GB to under 2 GB.

---

### Step 3: Delete Disposable Build Junk (Saves ~450 MB)
```bash
# Clean .NET build output
cd backend
dotnet clean
rm -rf src/*/bin src/*/obj tests/*/bin tests/*/obj

# Clean frontend node_modules and Angular cache
cd ../frontend
rm -rf node_modules .angular .output dist

cd ..
```

---

### Step 4: Safely Copy to External SSD
Use `rsync` with archive mode (`-a`), verbose progress (`-P`), and verification:
```bash
# Create Projects folder on SSD if not existing
mkdir -p /Volumes/WD-SN570-1TB/Projects

# Resumable copy of the entire cleaned project
rsync -avP /Users/bharathnair/Projects/RevisionAI /Volumes/WD-SN570-1TB/Projects/
```

---

### Step 5: Verification Check
Run these checks on the SSD copy:
```bash
cd /Volumes/WD-SN570-1TB/Projects/RevisionAI

# Verify git recognizes the clean repo
git status
git log -1

# Verify pipeline inputs and backend media exist
ls -lh pipeline/input/SOURCES/Notes | head -n 5
ls -lh backend/src/RevisionAI.Api/wwwroot/media | head -n 5
```

---

### Step 6: Free Up MacBook Internal Storage
Only after Step 5 passes cleanly:
```bash
# Remove project from MacBook
rm -rf /Users/bharathnair/Projects/RevisionAI
```
🎉 **Result:** You have reclaimed **~12 GB of internal space on your MacBook** while preserving 100% of your code, questions, and media.

---

## 5. Phase 2: Reactivation Procedure (When you resume in 3+ weeks)

When you are ready to resume work on RevisionAI:

### Step 1: Plug in External SSD
Connect your UGREEN enclosure with the WD-SN570 SSD. Verify it mounts at:
`/Volumes/WD-SN570-1TB`

### Step 2: Open in Antigravity or VS Code
Open the project directory directly from the SSD:
* In terminal: `cd /Volumes/WD-SN570-1TB/Projects/RevisionAI`
* In Antigravity / Cursor / VS Code: **File → Open Folder → `/Volumes/WD-SN570-1TB/Projects/RevisionAI`**

### Step 3: Restore Dependencies (One-time command)
```bash
# 1. Restore Backend .NET dependencies & build
cd /Volumes/WD-SN570-1TB/Projects/RevisionAI/backend
dotnet restore
dotnet build

# 2. Restore Frontend packages
cd ../frontend
npm install

# 3. Ready to run!
```

### Step 4: Normal Development Workflow
* Run Backend: `cd backend/src/RevisionAI.Api && dotnet run`
* Run Frontend: `cd frontend && npm start`
* Run Pipeline: `cd pipeline && python3 validator.py`
Everything works exactly as before.

---

## 6. Crucial Operating Rules for External SSD Development

1. **Never unplug while compiling or running:** Always stop your dev servers (`Ctrl + C`) and wait for commands to finish before disconnecting the drive.
2. **Safely Eject in macOS:** Right-click the drive icon or click the Eject icon next to `WD-SN570-1TB` in Finder before removing the cable.
3. **Mac Sleep Settings:** If your MacBook goes to sleep during a long compilation or extraction, macOS might unmount the USB drive. Keep your MacBook awake or plugged into power during heavy batch extractions.
4. **Git Push Habit:** Commit and push to GitHub at the end of every work session. That way, even if you lose or drop the physical SSD, zero code is lost.
