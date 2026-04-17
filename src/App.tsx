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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="concepts/basic-query" element={<BasicQuery />} />
          <Route path="concepts/variables" element={<Variables />} />
          <Route path="concepts/lazy-query" element={<LazyQuery />} />
          <Route path="concepts/fragments" element={<Fragments />} />
          <Route path="concepts/pagination" element={<Pagination />} />
          <Route path="concepts/fetch-policies" element={<FetchPolicies />} />
          <Route path="concepts/cache-rw" element={<CacheReadWrite />} />
          <Route path="concepts/cache-invalidation" element={<CacheInvalidation />} />
          <Route path="concepts/optimistic-ui" element={<OptimisticUI />} />
          <Route path="concepts/reactive-vars" element={<ReactiveVariables />} />
          <Route path="concepts/type-policies" element={<TypePolicies />} />
          <Route path="concepts/error-handling" element={<ErrorHandling />} />
          <Route path="concepts/use-mutation" element={<UseMutation />} />
          <Route path="concepts/link-chain" element={<LinkChain />} />
          <Route path="concepts/use-fragment" element={<UseFragment />} />
          <Route path="concepts/polling" element={<Polling />} />
          <Route path="concepts/subscriptions" element={<Subscriptions />} />
          <Route path="concepts/directives" element={<Directives />} />
          <Route path="concepts/testing" element={<Testing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
