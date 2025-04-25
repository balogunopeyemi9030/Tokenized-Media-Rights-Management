;; Creator Verification Contract
;; This contract validates content producers and maintains their verification status

(define-data-var admin principal tx-sender)

;; Data structure for creators
(define-map creators
  { creator-id: principal }
  {
    name: (string-utf8 100),
    verified: bool,
    registration-date: uint
  }
)

;; Register a new creator
(define-public (register-creator (name (string-utf8 100)))
  (let ((caller tx-sender))
    (if (is-some (map-get? creators { creator-id: caller }))
      (err u1) ;; Creator already exists
      (ok (map-insert creators
        { creator-id: caller }
        {
          name: name,
          verified: false,
          registration-date: block-height
        }
      ))
    )
  )
)

;; Verify a creator (admin only)
(define-public (verify-creator (creator-id principal))
  (let ((caller tx-sender))
    (asserts! (is-eq caller (var-get admin)) (err u403)) ;; Only admin can verify
    (match (map-get? creators { creator-id: creator-id })
      creator-data (ok (map-set creators
                        { creator-id: creator-id }
                        (merge creator-data { verified: true })
                      ))
      (err u404) ;; Creator not found
    )
  )
)

;; Check if a creator is verified
(define-read-only (is-verified (creator-id principal))
  (match (map-get? creators { creator-id: creator-id })
    creator-data (ok (get verified creator-data))
    (err u404) ;; Creator not found
  )
)

;; Transfer admin rights
(define-public (set-admin (new-admin principal))
  (let ((caller tx-sender))
    (asserts! (is-eq caller (var-get admin)) (err u403))
    (ok (var-set admin new-admin))
  )
)
