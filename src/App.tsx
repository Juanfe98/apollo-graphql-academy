import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import Home from './pages/Home'
import BasicQuery from './pages/01-BasicQuery'
import Variables from './pages/02-Variables'
import LazyQuery from './pages/03-LazyQuery'
import Fragments from './pages/04-Fragments'
import Pagination from './pages/05-Pagination'
import FetchPolicies from './pages/06-FetchPolicies'
import CacheReadWrite from './pages/07-CacheReadWrite'
import CacheInvalidation from './pages/08-CacheInvalidation'
import OptimisticUI from './pages/09-OptimisticUI'
import ReactiveVariables from './pages/10-ReactiveVariables'
import TypePolicies from './pages/11-TypePolicies'
import ErrorHandling from './pages/12-ErrorHandling'
import UseMutation from './pages/13-UseMutation'
import LinkChain from './pages/14-LinkChain'
import UseFragment from './pages/15-UseFragment'
import Polling from './pages/16-Polling'
import Subscriptions from './pages/17-Subscriptions'
import Directives from './pages/18-Directives'
import Testing from './pages/19-Testing'
import Aliases from './pages/20-Aliases'
import Introspection from './pages/21-Introspection'
import InterfacesUnions from './pages/22-InterfacesUnions'
import CustomScalars from './pages/23-CustomScalars'
import CursorPagination from './pages/24-CursorPagination'
import SuspenseQuery from './pages/25-useSuspenseQuery'
import BackgroundQuery from './pages/26-useBackgroundQuery'
import LoadableQuery from './pages/27-useLoadableQuery'
import DeferPage from './pages/28-Defer'
import BatchHttpLinkPage from './pages/29-BatchHttpLink'
import PersistedQueries from './pages/30-PersistedQueries'
import Federation from './pages/31-Federation'
import FileUploads from './pages/32-FileUploads'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Home />} />
          {/* Beginner */}
          <Route path="concepts/basic-query" element={<BasicQuery />} />
          <Route path="concepts/variables" element={<Variables />} />
          <Route path="concepts/lazy-query" element={<LazyQuery />} />
          <Route path="concepts/aliases" element={<Aliases />} />
          {/* Intermediate */}
          <Route path="concepts/fragments" element={<Fragments />} />
          <Route path="concepts/pagination" element={<Pagination />} />
          <Route path="concepts/cursor-pagination" element={<CursorPagination />} />
          <Route path="concepts/fetch-policies" element={<FetchPolicies />} />
          <Route path="concepts/cache-rw" element={<CacheReadWrite />} />
          <Route path="concepts/use-mutation" element={<UseMutation />} />
          <Route path="concepts/polling" element={<Polling />} />
          <Route path="concepts/directives" element={<Directives />} />
          <Route path="concepts/introspection" element={<Introspection />} />
          <Route path="concepts/interfaces-unions" element={<InterfacesUnions />} />
          <Route path="concepts/custom-scalars" element={<CustomScalars />} />
          {/* Advanced */}
          <Route path="concepts/cache-invalidation" element={<CacheInvalidation />} />
          <Route path="concepts/optimistic-ui" element={<OptimisticUI />} />
          <Route path="concepts/reactive-vars" element={<ReactiveVariables />} />
          <Route path="concepts/type-policies" element={<TypePolicies />} />
          <Route path="concepts/error-handling" element={<ErrorHandling />} />
          <Route path="concepts/link-chain" element={<LinkChain />} />
          <Route path="concepts/use-fragment" element={<UseFragment />} />
          <Route path="concepts/subscriptions" element={<Subscriptions />} />
          <Route path="concepts/testing" element={<Testing />} />
          <Route path="concepts/suspense-query" element={<SuspenseQuery />} />
          <Route path="concepts/background-query" element={<BackgroundQuery />} />
          <Route path="concepts/loadable-query" element={<LoadableQuery />} />
          <Route path="concepts/defer" element={<DeferPage />} />
          <Route path="concepts/batch-http" element={<BatchHttpLinkPage />} />
          <Route path="concepts/persisted-queries" element={<PersistedQueries />} />
          <Route path="concepts/federation" element={<Federation />} />
          <Route path="concepts/file-uploads" element={<FileUploads />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
