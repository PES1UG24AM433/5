# TC-STAFF-02 evidence

Tested on commit `bd493fb` by Codex on 16 Nov 2026; pending Rohini review.

- Staff `POST /api/menu` → **201**; `PATCH /api/menu/<id>` → **200**; `DELETE /api/menu/<id>` → **200**.
- Student `POST /api/menu` → **403**.

Actual: Authorized menu CRUD succeeded and a student was rejected. **Status: Pass.**
