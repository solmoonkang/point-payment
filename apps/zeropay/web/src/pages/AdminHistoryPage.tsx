// 제안서에 없음 · 상품권 내역 (예시 7 과 같은 틀, 첫 칸이 승인 번호)
import { useState } from 'react'
import { adminApi, useLoad, won, type HistoryRow } from '../api'
import { AdminFrame } from '../components/AdminFrame'

const KIND_TEXT = { grant: '지급', use: '사용', cancel: '사용 취소' } as const
const PAGE_SIZE = 10

// 화면 · CSV 공용
const COLUMNS: [string, (row: HistoryRow) => string][] = [
  ['승인 번호', (row) => row.approvalNo ?? '-'],
  ['구분', (row) => KIND_TEXT[row.kind]],
  ['회원', (row) => row.memberName],
  ['연락처', (row) => row.phone],
  ['가맹점', (row) => row.merchant ?? '-'],
  ['가맹점 주문 번호', (row) => row.merchantOrderId ?? '-'],
  ['금액', (row) => (row.amount > 0 ? '+' : '') + won(row.amount)],
  ['잔액', (row) => won(row.balanceAfter)],
  ['일시', (row) => new Date(row.at).toLocaleString('sv-SE')],
]

export function AdminHistoryPage() {
  const history = useLoad(adminApi.history, [])
  const empty = { text: '', kind: '', from: '', to: '' }
  const [draft, setDraft] = useState(empty) // 입력 중인 조건
  const [filter, setFilter] = useState(empty) // 「검색」을 누른 조건
  const [page, setPage] = useState(1)

  const rows = (history.data?.rows ?? []).filter((row) => {
    const day = new Date(row.at).toLocaleString('sv-SE').slice(0, 10)
    const text = [row.approvalNo, row.memberName, row.phone, row.merchant].join(' ')
    return (!filter.text || text.includes(filter.text)) && (!filter.kind || row.kind === filter.kind) && (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
  })
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 엑셀(CSV) 내려받기 — 엑셀이 한글을 읽도록 BOM 을 붙임
  const download = () => {
    const lines = [COLUMNS.map(([title]) => title), ...rows.map((row) => COLUMNS.map(([, value]) => value(row)))]
    const csv = '﻿' + lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = '상품권내역.csv'
    link.click()
  }

  return (
    <AdminFrame current="/admin" crumb="상품권 내역" action={<button onClick={download}>엑셀 다운로드</button>}>
      <div className="flt">
        <div>
          <label>검색</label>
          <input className="in" style={{ width: 370 }} placeholder="승인 번호 · 회원 · 연락처 · 가맹점 검색" value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
        </div>
        <div>
          <label>구분</label>
          <select className="in" style={{ width: 190 }} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>
            <option value="">전체</option>
            <option value="grant">지급</option>
            <option value="use">사용</option>
            <option value="cancel">사용 취소</option>
          </select>
        </div>
        <div>
          <label>일자</label>
          <input className="in" type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /> ~{' '}
          <input className="in" type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} />
        </div>
        <button className="go" onClick={() => (setFilter(draft), setPage(1))}>
          검색
        </button>
        <button className="rs" onClick={() => (setDraft(empty), setFilter(empty), setPage(1))}>
          초기화
        </button>
      </div>

      <table>
        <thead>
          <tr>
            {COLUMNS.map(([title]) => (
              <th key={title}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row) => (
            <tr key={row.entryId}>
              {COLUMNS.map(([title, value]) => (
                <td key={title}>{value(row)}</td>
              ))}
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length}>내역이 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pg">
        <span>Total {rows.length}</span>
        <div>
          <button onClick={() => setPage(Math.max(1, page - 1))}>‹</button>
          {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
            <button key={number} className={number === page ? 'cur' : ''} onClick={() => setPage(number)}>
              {number}
            </button>
          ))}
          <button onClick={() => setPage(Math.min(pages, page + 1))}>›</button>
        </div>
      </div>
    </AdminFrame>
  )
}
