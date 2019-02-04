import { Query } from 'react-apollo'
import gql from 'graphql-tag'
import React from 'react'
import ReactDOM from 'react-dom'
const { Suspense, Fragment, useState } = React
import { ApolloProvider, Subscription } from 'react-apollo'
import {
   useQuery,
   ApolloProvider as ApolloHooksProvider,
} from 'react-apollo-hooks'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { setContext } from 'apollo-link-context'
import './index.css'
const classNames = (...args) => args.join(' ')

const GRAPHQL_ENDPOINT = 'ws://localhost:8888/graphql'

const subscriptionClient = new SubscriptionClient(GRAPHQL_ENDPOINT, {
   reconnect: true,
})

const wsLink = new WebSocketLink(subscriptionClient)

const SAMPLE_TOKEN =
   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImV2YW5AdGVzdC5vcmciLCJlbWFpbCI6ImV2YW5AdGVzdC5vcmciLCJpYXQiOjE1NDkyNjM5MzcsImV4cCI6MTU4MDgyMTUzN30.SuQhXNtJKG4oCZg-20Y1rTamA1LlK9bDnnnGQNjIT60'

const authLink = setContext((_, { headers }) => {
   localStorage.setItem('AUTH_TOKEN', SAMPLE_TOKEN)
   const token = localStorage.getItem('AUTH_TOKEN')
   return {
      headers: {
         ...headers,
         authorization: token ? `Bearer ${token}` : '',
      },
   }
})

const client = new ApolloClient({
   link: authLink.concat(wsLink),
   cache: new InMemoryCache(),
})

const start = () =>
   client
      .query({
         query: gql`
            {
               xrangeLogger(
                  key: "logger:examples:graphql-logger:1:x"
                  start: "1544000000000-1"
                  end: "1544000000009-1"
               ) {
                  timestamp
                  name
                  level
                  vars
               }
            }
         `,
      })
      .then(result => console.log(result))

const Record = ({ record, index, hideTime }) => {
   const time = new Date(Number(record.timestamp.match(/[0-9]*/).pop()))
   return (
      <tr
         key={record.timestamp}
         className={classNames(index === 0 ? 'initial' : 'alternate')}
      >
         <td className={classNames('name', record.level)}>{record.name}</td>
         <td className={classNames('timestamp-seconds', record.level)}>
            {hideTime ? '' : time.toLocaleTimeString()}
         </td>
         <td className={classNames('timestamp-milliseconds', record.level)}>
            {time
               .toISOString()
               .match(/\.[0-9]*/)
               .pop()}
         </td>
         <td className={classNames('level', record.level)}>{record.level}</td>
         <td className={classNames('vars', record.level)}>
            {Object.keys(JSON.parse(record.vars)).join(' ')}
         </td>
      </tr>
   )
}

const Records = ({ records }) => {
   console.log({ records }, 'Records')
   return (
      <table className="recordTable">
         <thead>
            <tr>
               <th>Name</th>
               <th>Time</th>
               <th>Ms</th>
               <th>Level</th>
               <th>Keys</th>
            </tr>
         </thead>
         <tbody>
            {records.map((record, index) => (
               <Record
                  key={index}
                  record={record}
                  index={index}
                  hideTime={index > 0}
               />
            ))}
         </tbody>
      </table>
   )
}

const SUBSCRIPTION = gql`
   subscription {
      loggerChanged {
         name
         timestamp
         level
         vars
      }
   }
`

const QUERY = gql`
   {
      xrangeLogger(
         key: "logger:examples:graphql-logger:1:x"
         start: "-"
         end: "+"
      ) {
         name
         timestamp
         level
         vars
      }
   }
`

function App() {
   return (
      <ApolloProvider client={client}>
         <ApolloHooksProvider client={client}>
            <div id="App">
               <h2>My first Apollo app 🚀</h2>
               <Suspense fallback={<span className="loading">Loading...</span>}>
                  <ApolloApp />
               </Suspense>
            </div>
         </ApolloHooksProvider>
      </ApolloProvider>
   )
}

function LiveRecords({ initialRecords }) {
   console.log({ initialRecords }, 'LiveRecords')
   const [records, setRecords] = useState(initialRecords)
   console.log({ records }, 'LiveRecords')
   return (
      <Fragment>
         <Subscription subscription={SUBSCRIPTION}>
            {({ data, loading }) => {
               if (loading) {
               } else {
                  //setRecords([data.loggerChanged, ...records])
               }
               return null
            }}
         </Subscription>
         <Records records={records} />
      </Fragment>
   )
}

function ApolloApp() {
   const { data, error } = useQuery(QUERY, { variables: {} })
   if (error) {
      return <span className="queryStatus">Error</span>
   } else {
      console.log({ data }, 'ApolloApp')
      return (
         <Fragment>
            <LiveRecords initialRecords={data.xrangeLogger} />
         </Fragment>
      )
   }
}

ReactDOM.render(<App />, document.getElementById('root'))

// Hot Module Replacement
if (module.hot) {
   module.hot.accept()
}
