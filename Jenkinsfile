pipeline {
    agent { label 'jenkins-Agent' }

   

    environment {
        SONAR_PROJECT_KEY = 'frontdevops'
        APP_NAME = "frontdevops"
        RELEASE = "1.0.0"
        DOCKER_USER = "rima603"
        DOCKER_REGISTRY = "docker.io"
        IMAGE_NAME = "${DOCKER_REGISTRY}/${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG = "${RELEASE}-${BUILD_NUMBER}"
        TRIVY_CACHE = "trivy-cache-${BUILD_NUMBER}"
    }

    stages {
        stage('Cleanup Workspace') {
            steps {
                cleanWs()
                sh "docker system prune -f || true"
                sh "docker volume create ${TRIVY_CACHE} || true"
            }
        }

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/rima-gif/FrontDevSecOps'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Angular') {
            steps {
                sh 'npm run build'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    withCredentials([string(credentialsId: 'jenkins-sonarqube-token', variable: 'SONAR_TOKEN')]) {
                        sh """
                            npx sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=src \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Docker Build and Push') {
            steps {
                script {
                    if (!fileExists('Dockerfile')) {
                        error "Dockerfile non trouvé dans le workspace"
                    }

                    sh """
                        docker build --no-cache --pull -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Initialize Trivy DB') {
            steps {
                sh """
                    docker run --rm \
                    -v ${TRIVY_CACHE}:/root/.cache/trivy \
                    aquasec/trivy:0.61.1 \
                    image --download-db-only alpine:latest
                """
            }
        }

        stage('Trivy Scan') {
            steps {
                script {
                    def trivyOutput = sh(script: """
                        docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v ${TRIVY_CACHE}:/root/.cache/trivy \
                        aquasec/trivy:0.61.1 \
                        image ${IMAGE_NAME}:${IMAGE_TAG} \
                        --no-progress \
                        --scanners vuln \
                        --severity HIGH,CRITICAL \
                        --format table \
                        --timeout 15m \
                        --exit-code 1
                    """, returnStatus: true)

                    if (trivyOutput == 1) {
                        currentBuild.result = 'UNSTABLE'
                        echo "⚠️ Vulnérabilités HIGH ou CRITICAL détectées par Trivy"
                    }
                }
            }
        }

        stage('Cleanup Docker') {
            steps {
                sh """
                    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${IMAGE_NAME}:latest || true
                    docker volume rm -f ${TRIVY_CACHE} || true
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé avec le statut : ${currentBuild.result ?: 'SUCCESS'}"
            cleanWs()
        }
        failure {
            echo '🚨 Pipeline échoué — vérifie les logs.'
        }
        unstable {
            echo '⚠️ Pipeline instable — des vulnérabilités ont été détectées.'
        }
        success {
            echo '✅ Pipeline Front terminé avec succès !'
        }
    }
}
