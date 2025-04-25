;; Revenue Tracking Contract
;; This contract records consumption and payments

(define-data-var admin principal tx-sender)

;; Data structure for revenue records
(define-map revenue-records
  {
    asset-id: uint,
    period: uint ;; Tracking period (e.g., month number)
  }
  {
    streams: uint,
    downloads: uint,
    revenue-amount: uint,
    last-updated: uint
  }
)

;; Total revenue by asset
(define-map asset-total-revenue
  { asset-id: uint }
  { total-revenue: uint }
)

;; Record consumption event (streaming, download, etc.)
(define-public (record-consumption
                (asset-id uint)
                (period uint)
                (stream-count uint)
                (download-count uint)
                (revenue uint))
  (let ((caller tx-sender))
    ;; Only authorized distributors can record consumption
    (asserts! (is-authorized-distributor caller asset-id) (err u403))

    ;; Get existing record or create new one
    (match (map-get? revenue-records { asset-id: asset-id, period: period })
      existing-record
        (map-set revenue-records
          { asset-id: asset-id, period: period }
          {
            streams: (+ (get streams existing-record) stream-count),
            downloads: (+ (get downloads existing-record) download-count),
            revenue-amount: (+ (get revenue-amount existing-record) revenue),
            last-updated: block-height
          }
        )
      ;; No existing record, create new
      (map-insert revenue-records
        { asset-id: asset-id, period: period }
        {
          streams: stream-count,
          downloads: download-count,
          revenue-amount: revenue,
          last-updated: block-height
        }
      )
    )

    ;; Update total revenue for the asset
    (update-asset-total-revenue asset-id revenue)

    (ok true)
  )
)

;; Helper to update total revenue
(define-private (update-asset-total-revenue (asset-id uint) (revenue uint))
  (match (map-get? asset-total-revenue { asset-id: asset-id })
    existing-total
      (map-set asset-total-revenue
        { asset-id: asset-id }
        { total-revenue: (+ (get total-revenue existing-total) revenue) }
      )
    ;; No existing total, create new
    (map-insert asset-total-revenue
      { asset-id: asset-id }
      { total-revenue: revenue }
    )
  )
)

;; Get revenue data for an asset in a specific period
(define-read-only (get-period-revenue (asset-id uint) (period uint))
  (match (map-get? revenue-records { asset-id: asset-id, period: period })
    record-data (ok record-data)
    (err u404) ;; No record found
  )
)

;; Get total revenue for an asset
(define-read-only (get-asset-total-revenue (asset-id uint))
  (match (map-get? asset-total-revenue { asset-id: asset-id })
    total-data (ok (get total-revenue total-data))
    (err u404) ;; No record found
  )
)

;; Helper function to check if caller is an authorized distributor
(define-read-only (is-authorized-distributor (caller principal) (asset-id uint))
  ;; In a real implementation, this would check the distribution rights contract
  ;; Simplified for demonstration
  (or
    (is-eq caller (var-get admin))
    (is-active-distributor asset-id caller)
  )
)

;; Check if a distributor is active for an asset
(define-read-only (is-active-distributor (asset-id uint) (distributor principal))
  ;; Simplified implementation - in a real system, this would check the distribution rights contract
  (is-eq distributor (var-get admin))
)
