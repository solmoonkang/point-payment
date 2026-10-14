import { Route, Switch } from 'wouter'
import { AdminGate } from './components/AdminGate'
import { AdminGrantPage } from './pages/AdminGrantPage'
import { AdminHistoryPage } from './pages/AdminHistoryPage'
import { AdminSettingsPage } from './pages/AdminSettingsPage'
import { ApprovePage } from './pages/ApprovePage'
import { StartPage } from './pages/StartPage'

export function App() {
  return (
    <Switch>
      <Route path="/" component={StartPage} />
      <Route path="/approve/:usageId" component={ApprovePage} />
      <Route path="/admin">
        <AdminGate>
          <AdminHistoryPage />
        </AdminGate>
      </Route>
      <Route path="/admin/grant">
        <AdminGate>
          <AdminGrantPage />
        </AdminGate>
      </Route>
      <Route path="/admin/settings">
        <AdminGate>
          <AdminSettingsPage />
        </AdminGate>
      </Route>
      <Route>없는 화면입니다</Route>
    </Switch>
  )
}
