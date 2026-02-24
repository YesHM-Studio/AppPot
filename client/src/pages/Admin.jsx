import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

export default function Admin() {
  const { api } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/api/admin/users').then(({ data }) => setUsers(data));
  }, []);

  useEffect(() => {
    if (tab === 'reports') api.get('/api/admin/reports').then(({ data }) => setReports(data));
  }, [tab]);

  useEffect(() => {
    if (tab === 'payments') api.get('/api/admin/payments').then(({ data }) => setPayments(data));
  }, [tab]);

  return (
    <div className="admin-page">
      <h1>관리자</h1>
      <div className="admin-tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>회원</button>
        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>신고</button>
        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>정산</button>
      </div>
      {tab === 'users' && (
        <div className="admin-table">
          <table>
            <thead>
              <tr><th>이름</th><th>이메일</th><th>역할</th><th>가입일</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'reports' && (
        <div className="admin-table">
          <table>
            <thead>
              <tr><th>신고자</th><th>대상</th><th>유형</th><th>상태</th></tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.reporter_name}</td>
                  <td>{r.target_name}</td>
                  <td>{r.type}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'payments' && (
        <div className="admin-table">
          <table>
            <thead>
              <tr><th>의뢰자</th><th>판매자</th><th>금액</th><th>상태</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.buyer_name}</td>
                  <td>{p.seller_name}</td>
                  <td>{p.amount?.toLocaleString()}원</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
