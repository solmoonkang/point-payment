import { Route, Switch } from 'wouter'
import { AdminGate } from './components/AdminGate'
import { AdminDevPage } from './pages/AdminDevPage'
import { AdminSubscribersPage } from './pages/AdminSubscribersPage'
import { JoinPage } from './pages/join/JoinPage'
import { PickPage } from './pages/PickPage'
import { ResultPage } from './pages/ResultPage'

export function App() {
  return (
    <Switch>
      <Route path="/" component={PickPage} />
      <Route path="/join/:productId" component={JoinPage} />
      <Route path="/pay/result/:orderId" component={ResultPage} />
      <Route path="/admin">
        <AdminGate>
          <AdminSubscribersPage />
        </AdminGate>
      </Route>
      <Route path="/admin/dev">
        <AdminGate>
          <AdminDevPage />
        </AdminGate>
      </Route>
      <Route>없는 화면입니다</Route>
    </Switch>
  )
}
