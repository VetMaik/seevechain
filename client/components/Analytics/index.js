import React from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import Spinner from 'components/Spinner'
import { useEffect, useState } from 'preact/hooks'
import Chart from 'react-chartist'

import './index.sass'

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    axios.get('/api/visitor_analytics').then(({data}) => {
      setAnalytics({ uniqueVisits: data.uniqueVisits })
    })
  }, [])
  if (!Cookies.get('seeVechainAuthorized')) return <div className="Analytics">Unauthorized</div>
  if (!analytics) return <div className="Analytics"><Spinner /></div>

  const labels = []
  const series = []
  analytics.uniqueVisits.reverse().forEach(({ count, date }) => {
    labels.push(date)
    series.push(count)
  })
  const chartData = { labels, series: [series] }

  const options = {
    width: '1000px',
    height: '500px',
    showArea: true,
  }

  return <div className="Analytics">
    <p>Today: {analytics.uniqueVisits[analytics.uniqueVisits.length - 1].count}</p>
    <p>Last {analytics.uniqueVisits.length} days:</p>
    <Chart data={chartData} options={options} type="Line" responsiveOptions />
  </div>
}
