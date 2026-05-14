class TestCreateTask:
    """POST /api/tasks"""

    def test_최소_필드로_생성(self, client):
        res = client.post("/api/tasks", json={"title": "테스트"})
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "테스트"
        assert data["status"] == "todo"
        assert data["due_at"] is None

    def test_전체_필드로_생성(self, client):
        res = client.post("/api/tasks", json={
            "title": "전체 필드",
            "description": "설명 내용",
            "status": "in_progress",
            "due_at": "2026-06-01T18:00:00",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["description"] == "설명 내용"
        assert data["status"] == "in_progress"
        assert "2026-06-01" in data["due_at"]

    def test_title_누락_400(self, client):
        res = client.post("/api/tasks", json={})
        assert res.status_code == 400

    def test_title_빈문자열_400(self, client):
        res = client.post("/api/tasks", json={"title": "   "})
        assert res.status_code == 400

    def test_잘못된_status_400(self, client):
        res = client.post("/api/tasks", json={"title": "x", "status": "invalid_status"})
        assert res.status_code == 400

    def test_due_at_형식오류_400(self, client):
        res = client.post("/api/tasks", json={"title": "x", "due_at": "not-a-date"})
        assert res.status_code == 400


class TestListTasks:
    """GET /api/tasks"""

    def test_빈_목록_200(self, client):
        res = client.get("/api/tasks")
        assert res.status_code == 200
        assert res.json() == []

    def test_목록에_description_제외(self, client):
        client.post("/api/tasks", json={"title": "설명 있는 태스크", "description": "내용"})
        res = client.get("/api/tasks")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert "description" not in res.json()[0]

    def test_여러_태스크_목록_반환(self, client):
        client.post("/api/tasks", json={"title": "태스크 A"})
        client.post("/api/tasks", json={"title": "태스크 B"})
        res = client.get("/api/tasks")
        assert res.status_code == 200
        assert len(res.json()) == 2


class TestGetTask:
    """GET /api/tasks/{id}"""

    def test_단건_조회_200(self, client):
        created = client.post("/api/tasks", json={"title": "단건", "description": "설명"}).json()
        res = client.get(f"/api/tasks/{created['id']}")
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "단건"
        assert "description" in data           # 단건은 description 포함
        assert data["description"] == "설명"

    def test_없는_id_404(self, client):
        res = client.get("/api/tasks/9999")
        assert res.status_code == 404


class TestUpdateTask:
    """PUT /api/tasks/{id}"""

    def test_status만_수정(self, client):
        created = client.post("/api/tasks", json={"title": "원본 제목"}).json()
        res = client.put(f"/api/tasks/{created['id']}", json={"status": "done"})
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "done"
        assert data["title"] == "원본 제목"     # 기존 필드 유지 확인

    def test_전체_필드_수정(self, client):
        created = client.post("/api/tasks", json={"title": "수정 전"}).json()
        res = client.put(f"/api/tasks/{created['id']}", json={
            "title": "수정 후",
            "description": "새 설명",
            "status": "in_progress",
            "due_at": "2026-07-01T09:00:00",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "수정 후"
        assert data["description"] == "새 설명"

    def test_없는_id_404(self, client):
        res = client.put("/api/tasks/9999", json={"status": "done"})
        assert res.status_code == 404

    def test_잘못된_status_수정시_400(self, client):
        created = client.post("/api/tasks", json={"title": "수정 테스트"}).json()
        res = client.put(f"/api/tasks/{created['id']}", json={"status": "wrong"})
        assert res.status_code == 400


class TestDeleteTask:
    """DELETE /api/tasks/{id}"""

    def test_삭제_204(self, client):
        created = client.post("/api/tasks", json={"title": "삭제 대상"}).json()
        res = client.delete(f"/api/tasks/{created['id']}")
        assert res.status_code == 204

    def test_삭제_후_조회_404(self, client):
        created = client.post("/api/tasks", json={"title": "삭제 후 확인"}).json()
        client.delete(f"/api/tasks/{created['id']}")
        res = client.get(f"/api/tasks/{created['id']}")
        assert res.status_code == 404

    def test_삭제_후_목록에서_제거(self, client):
        created = client.post("/api/tasks", json={"title": "목록 제거 확인"}).json()
        client.delete(f"/api/tasks/{created['id']}")
        res = client.get("/api/tasks")
        assert res.json() == []

    def test_없는_id_404(self, client):
        res = client.delete("/api/tasks/9999")
        assert res.status_code == 404
