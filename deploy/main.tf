provider "kubernetes" {
  config_path = "~/.kube/config"  # Kubernetes 클러스터 접근 설정 파일 경로
}

locals {
    namespace = "streaming"
}

resource "kubernetes_deployment" "streamjs" {
  metadata {
    name      = "streamjs-deployment"
    namespace = local.namespace
    labels = {
      app = "streamjs"
    }
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "streamjs"
      }
    }

    template {
      metadata {
        labels = {
          app = "streamjs"
        }
      }

      spec {
        container {
          name  = "streamjs"
          image = "devjyk/streamjs:latest"

          port {
            container_port = 8080  # 컨테이너 내부에서 서비스되는 포트
          }

          resources {
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
          }

          env {
            name  = "KAFKA_CLIENT_ID"
            value = "streamjs"
          }

          env {
            name  = "KAFKA_BROKERS"
            value = "kafka-kafka-bootstrap.streaming.svc.cluster.local:9092"
          }

          liveness_probe {
            http_get {
              path = "/ping"
              port = 3000
            }
            initial_delay_seconds = 3
            period_seconds         = 30
          }

          readiness_probe {
            http_get {
              path = "/ping"
              port = 3000
            }
            initial_delay_seconds = 3
            period_seconds         = 30
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "streamjs" {
  metadata {
    name      = "streamjs-service"
    namespace = local.namespace
  }

  spec {
    selector = {
      app = "streamjs"
    }

    port {
      port        = 80    # 클러스터 외부에 노출될 포트
      target_port = 8080  # 컨테이너 내부 포트
    }

    type = "ClusterIP"  # 서비스 유형
  }
}
