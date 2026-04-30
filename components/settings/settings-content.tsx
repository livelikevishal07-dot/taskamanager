'use client'

import { useSettingsTab } from './settings-nav'
import { CompaniesPanel } from './companies-panel'
import { DepartmentsPanel } from './departments-panel'
import { RolesPanel } from './roles-panel'
import {
  GeneralPanel,
  NotificationsPanel,
  SessionsPanel,
} from './generic-panels'

export function SettingsContent() {
  const tab = useSettingsTab()

  switch (tab) {
    case 'companies':
      return <CompaniesPanel />
    case 'departments':
      return <DepartmentsPanel />
    case 'roles':
      return <RolesPanel />
    case 'general':
      return <GeneralPanel />
    case 'notifications':
      return <NotificationsPanel />
    case 'sessions':
      return <SessionsPanel />
  }
}
