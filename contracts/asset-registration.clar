;; Asset Registration Contract
;; This contract records details of media works

(define-data-var admin principal tx-sender)
(define-data-var asset-counter uint u0)

;; Data structure for media assets
(define-map assets
  { asset-id: uint }
  {
    title: (string-utf8 100),
    description: (string-utf8 500),
    creator: principal,
    creation-date: uint,
    content-hash: (buff 32) ;; Hash of the content for verification
  }
)

;; Creator ownership mapping
(define-map creator-assets
  { creator: principal }
  { asset-ids: (list 100 uint) }
)

;; Register a new media asset
(define-public (register-asset
                (title (string-utf8 100))
                (description (string-utf8 500))
                (content-hash (buff 32)))
  (let
    (
      (caller tx-sender)
      (new-asset-id (+ (var-get asset-counter) u1))
      (creator-assets-entry (default-to { asset-ids: (list 100) } (map-get? creator-assets { creator: caller })))
    )

    ;; Insert the new asset
    (map-insert assets
      { asset-id: new-asset-id }
      {
        title: title,
        description: description,
        creator: caller,
        creation-date: block-height,
        content-hash: content-hash
      }
    )

    ;; Update the creator's asset list
    (map-set creator-assets
      { creator: caller }
      { asset-ids: (append (get asset-ids creator-assets-entry) new-asset-id) }
    )

    ;; Increment the asset counter
    (var-set asset-counter new-asset-id)

    (ok new-asset-id)
  )
)

;; Get asset details
(define-read-only (get-asset (asset-id uint))
  (match (map-get? assets { asset-id: asset-id })
    asset-data (ok asset-data)
    (err u404) ;; Asset not found
  )
)

;; Get asset creator
(define-read-only (get-asset-creator (asset-id uint))
  (match (map-get? assets { asset-id: asset-id })
    asset-data (ok (get creator asset-data))
    (err u404) ;; Asset not found
  )
)

;; Check if a principal is the creator of an asset
(define-read-only (is-asset-creator (asset-id uint) (principal-to-check principal))
  (match (map-get? assets { asset-id: asset-id })
    asset-data (ok (is-eq (get creator asset-data) principal-to-check))
    (err u404) ;; Asset not found
  )
)

;; Get all assets owned by a creator
(define-read-only (get-creator-assets (creator principal))
  (match (map-get? creator-assets { creator: creator })
    creator-assets-entry (ok (get asset-ids creator-assets-entry))
    (err u404) ;; Creator has no assets
  )
)

;; Verify if an asset's content matches the registered hash
(define-read-only (verify-content (asset-id uint) (content-hash (buff 32)))
  (match (map-get? assets { asset-id: asset-id })
    asset-data (ok (is-eq (get content-hash asset-data) content-hash))
    (err u404) ;; Asset not found
  )
)
