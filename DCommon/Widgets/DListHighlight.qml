import QtQuick
import qs.DCommon.Common

Rectangle {
    property bool animate: true
    property bool firstInGroup: true
    property bool lastInGroup: true
    color: Style.selectedContainer
    radius: Style.flatComponents ? Math.min(Style.windowRadius, height / 2) : Style.groupedListInnerRadius
    topLeftRadius: Style.flatComponents ? radius : firstInGroup ? Style.groupedListOuterRadius : radius
    topRightRadius: topLeftRadius
    bottomLeftRadius: Style.flatComponents ? radius : lastInGroup ? Style.groupedListOuterRadius : radius
    bottomRightRadius: bottomLeftRadius

    Behavior on x {
        enabled: parent && parent.visible && animate && !Style.reduceMotion && !Style.springMotionDisabled
        NumberAnimation {
            duration: Style.shorterDuration
            easing.type: Easing.BezierSpline
            easing.bezierCurve: Style.expressiveCurves.expressiveFastSpatial
        }
    }
    Behavior on y {
        enabled: parent && parent.visible && animate && !Style.reduceMotion && !Style.springMotionDisabled
        NumberAnimation {
            duration: Style.shorterDuration
            easing.type: Easing.BezierSpline
            easing.bezierCurve: Style.expressiveCurves.expressiveFastSpatial
        }
    }
}
