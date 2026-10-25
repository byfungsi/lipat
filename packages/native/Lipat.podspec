require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
Pod::Spec.new do |s|
  s.name = 'Lipat'
  s.version = package['version']
  s.summary = 'Native Rust presentation engine for React Native and Expo'
  s.description = 'Synchronous shared Lipat JSON protocol: parsing, layout, editing, limits and PPTX import/export.'
  s.license = { :type => 'MIT' }
  s.author = 'byfungsi'
  s.homepage = 'https://github.com/byfungsi/lipat'
  s.source = { :git => 'https://github.com/byfungsi/lipat.git', :tag => "v#{s.version}" }
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = 'ios/**/*.swift'
  s.vendored_frameworks = 'LipatRustCore.xcframework'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
