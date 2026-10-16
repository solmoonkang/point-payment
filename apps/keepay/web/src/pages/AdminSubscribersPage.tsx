// 예시 7 어드민 - 가입자 리스트. 행을 누르면 결제 내역 · 가입 취소 (그림에 없음)
import { Fragment, useState } from 'react'
import { adminApi, messageOf, useLoad, won, type SubscriberRow } from '../api'
import { AdminFrame } from '../components/AdminFrame'

const PAGE_SIZE = 10
const STATUS_TEXT = { paid: '가입 완료', cancelled: '가입 취소', cancel_failed: '취소 미완료', failed: '결제 실패', pending: '처리 중' } as const

// 예시 7 의 칸 그대로 (화면 · CSV 공용)
const COLUMNS: [string, (row: SubscriberRow) => string][] = [
  ['#', (row) => String(row.orderId)],
  ['가입한 상품명', (row) => row.productName],
  ['이름', (row) => row.name],
  ['연락처', (row) => row.phone],
  ['비상 연락처', (row) => row.emergencyPhone ?? '-'],
  ['주소', (row) => row.address ?? '-'],
  ['이메일', (row) => row.email],
  ['프로모션 코드', (row) => row.promotionCode ?? '-'],
  ['접속 IP', (row) => row.ip],
  ['가입 일시', (row) => new Date(row.joinedAt).toLocaleString('sv-SE')],
]

export function AdminSubscribersPage() {
  const subscribers = useLoad(adminApi.subscribers, [])
  const empty = { text: '', payMethod: '', from: '', to: '' }
  const [draft, setDraft] = useState(empty) // 입력 중인 조건
  const [filter, setFilter] = useState(empty) // 「검색」을 누른 조건
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  // 검색은 안내 문구의 칸 중 가입 화면에서 받는 것만 (이름 · 연락처 · 이메일)
  const rows = (subscribers.data?.rows ?? []).filter((row) => {
    const day = new Date(row.joinedAt).toLocaleString('sv-SE').slice(0, 10)
    const text = [row.name, row.phone, row.email].join(' ')
    return (!filter.text || text.includes(filter.text)) && (!filter.payMethod || row.payMethod === filter.payMethod) && (!filter.from || day >= filter.from) && (!filter.to || day <= filter.to)
  })
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 엑셀(CSV) 내려받기 — 엑셀이 한글을 읽도록 BOM 을 붙임
  const download = () => {
    const lines = [COLUMNS.map(([title]) => title), ...rows.map((row) => COLUMNS.map(([, value]) => value(row)))]
    const csv = '﻿' + lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = '가입자리스트.csv'
    link.click()
  }

  const cancel = async (row: SubscriberRow) => {
    if (!window.confirm(`#${row.orderId} ${row.name} 님의 가입을 취소합니다. 카드 취소와 상품권 복원을 진행할까요?`)) return
    try {
      const { order } = await adminApi.cancel(row.orderId)
      setMessage(`#${order.id} ${STATUS_TEXT[order.status]}${order.failReason ? ` · ${order.failReason}` : ''}`)
    } catch (failure) {
      setMessage(messageOf(failure))
    }
    subscribers.reload()
  }

  return (
    <AdminFrame current="/admin" crumb={['가입자 관리', '가입자 리스트']} action={<button onClick={download}>엑셀 다운로드</button>}>
      <div className="flt">
        <div>
          <label>검색</label>
          <input className="in" style={{ width: 370 }} placeholder="이름 · 연락처 · 비상 연락처 · 주소 · 이메일 · 프로모션 코드 검색" value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
        </div>
        <div>
          <label>결제 수단</label>
          <select className="in" style={{ width: 190 }} value={draft.payMethod} onChange={(event) => setDraft({ ...draft, payMethod: event.target.value })}>
            <option value="">전체</option>
            <option value="포인트">포인트</option>
            <option value="카드">카드</option>
            <option value="포인트+카드">포인트+카드</option>
          </select>
        </div>
        <div>
          <label>가입일</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="in" type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} />~
            <input className="in" type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} />
          </div>
        </div>
        <button className="go" onClick={() => (setFilter(draft), setPage(1))}>
          검색
        </button>
        <button className="rs" onClick={() => (setDraft(empty), setFilter(empty), setPage(1))}>
          초기화
        </button>
      </div>

      {message && <p style={{ color: '#1677ff' }}>{message}</p>}
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
            <Fragment key={row.orderId}>
              <tr className={`row ${openId === row.orderId ? 'open' : ''}`} onClick={() => setOpenId(openId === row.orderId ? null : row.orderId)}>
                {COLUMNS.map(([title, value]) => (
                  <td key={title}>{value(row)}</td>
                ))}
              </tr>
              {openId === row.orderId && (
                <tr className="detail">
                  <td colSpan={COLUMNS.length}>
                    <div className="dbox">
                      <dl>
                        <dt>상태</dt>
                        <dd>{STATUS_TEXT[row.status]}</dd>
                        <dt>결제 수단</dt>
                        <dd>{row.payMethod}</dd>
                        <dt>포인트</dt>
                        <dd>{won(row.pointAmount)}P</dd>
                        <dt>카드</dt>
                        <dd>{won(row.pgAmount)}원</dd>
                        <dt>제로페이 승인 번호</dt>
                        <dd>{row.approvalNo ?? '-'}</dd>
                        <dt>결제금액</dt>
                        <dd>{won(row.price)}원</dd>
                        {row.failReason && (
                          <>
                            <dt>사유</dt>
                            <dd>{row.failReason}</dd>
                          </>
                        )}
                      </dl>
                      {(row.status === 'paid' || row.status === 'cancel_failed') && (
                        <button className="go" onClick={() => void cancel(row)}>
                          {row.status === 'paid' ? '가입 취소' : '취소 다시 시도'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length}>가입자가 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pg">
        <span style={{ width: 'auto', margin: 0, color: '#888' }}>Total {rows.length}</span>
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
