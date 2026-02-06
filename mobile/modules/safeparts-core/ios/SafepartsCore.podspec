package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SafepartsCore'
  s.version        = package['version']
  s.summary        = 'Safeparts core bridge (UniFFI + Expo Modules)'
  s.description    = 'Safeparts core bridge (UniFFI + Expo Modules)'
  s.license        = 'MIT'
  s.author         = 'Safeparts Contributors'
  s.homepage       = 'https://github.com/'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,swift}"
end
