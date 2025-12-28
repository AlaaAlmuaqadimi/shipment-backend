"use strict";

/*
  =============================
  Users Module (Front Only)
  =============================
  يرسم:
    - #users-table
  ويدير:
    - createDummyUser()
    - deleteUser(id)
*/

window.UsersData = window.UsersData || {
  users: [
    { id: 1, name: "Admin User", username: "admin", role: "Admin", permissions: "Full Access" },
    { id: 2, name: "Order Operator", username: "operator1", role: "Operator", permissions: "Add / Update Orders" }
  ]
};

/* ========= Render ========= */
function renderUsersTable() {
  const body = document.getElementById("users-table");
  if (!body) return;

  const users = window.UsersData.users || [];
  body.innerHTML = "";

  if (!users.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="muted">لا يوجد مستخدمون.</td>`;
    body.appendChild(tr);
    return;
  }

  users.forEach(u => {
    const tr = document.createElement("tr");

    // ✅ data-label لكل td (مهم للموبايل)
    tr.innerHTML = `
      <td data-label="الاسم">${u.name}</td>
      <td data-label="اليوزر">${u.username}</td>
      <td data-label="الدور">${u.role}</td>
      <td data-label="صلاحيات">${u.permissions}</td>
      <td data-label="تحكم" class="table-actions">
        <button class="icon-btn" onclick="editUser(${u.id})">تعديل</button>
        <button class="icon-btn danger" onclick="deleteUser(${u.id})">حذف</button>
      </td>
    `;

    body.appendChild(tr);
  });
}

/* ========= Create Dummy ========= */
function createDummyUser() {
  const users = window.UsersData.users || [];
  const id = users.length ? (users[users.length - 1].id + 1) : 1;

  users.push({
    id,
    name: "User " + id,
    username: "user" + id,
    role: "Operator",
    permissions: "Add Orders"
  });

  window.UsersData.users = users;
  renderUsersTable();
  alert("تمت إضافة مستخدم تجريبي جديد ✅");
}

/* ========= Delete ========= */
function deleteUser(id) {
  const users = window.UsersData.users || [];
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;

  if (!confirm("تأكيد حذف المستخدم؟")) return;

  users.splice(idx, 1);
  window.UsersData.users = users;
  renderUsersTable();
}

/* ========= Edit (Placeholder) ========= */
function editUser(id) {
  const users = window.UsersData.users || [];
  const u = users.find(x => x.id === id);
  if (!u) return;

  alert(
    "تعديل المستخدم (واجهة فقط):\n" +
      "الاسم: " + u.name + "\n" +
      "اليوزر: " + u.username + "\n" +
      "الدور: " + u.role + "\n" +
      "الصلاحيات: " + u.permissions
  );
}

/* ========= Route Hook ========= */
window.addEventListener("page:loaded", (e) => {
  if (e.detail.route === "users") renderUsersTable();
});

/* ========= Expose ========= */
window.renderUsersTable = renderUsersTable;
window.createDummyUser = createDummyUser;
window.deleteUser = deleteUser;
window.editUser = editUser;
